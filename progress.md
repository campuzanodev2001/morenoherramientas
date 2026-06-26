# Progreso de implementación — Moreno Herramientas

> Estado del backend de producción definido en `CLAUDE.md` y los docs `01-08`.
> Punto de partida: prototipo 100% frontend (catálogo estático en `lib/products.ts`,
> carrito en localStorage, admin en sessionStorage con password hardcodeada,
> checkout local sin pago real, sin ninguna dependencia de backend instalada).
>
> Seguimiento detallado feature por feature en `feature_list.json`.
> Última actualización: build completo en verde (`next build` exit 0, `tsc --noEmit` exit 0).

---

## Resumen

| Bloque | Estado |
|---|---|
| Infraestructura (env, errores, rate limit, middleware, observabilidad) | ✅ Completo |
| Base de datos (schemas + queries) | ✅ Completo |
| Autenticación + uploads | ✅ Completo |
| Panel admin sobre DB (auth, productos, dashboard, categorías, banners, hero/secciones) | ✅ Completo |
| Búsqueda fuzzy pg_trgm (API + página) | ✅ Completo |
| Catálogo público UI sobre DB (home/categoría/producto/buscar) | ✅ Completo |
| Carrito (DB para logueados + localStorage/cookie anónimo, merge al loguearse, CartDrawer) | ✅ Completo (CART-01) |
| Checkout multi-paso + cotización de envíos (Andreani + Correo) | ✅ Completo (CHECKOUT-01, SHIP-01) |
| MercadoPago: preferencia + Bricks + webhook + orden + cron | ✅ Completo (PAY-01..05) |
| Mails transaccionales con idempotencia (Resend) | ✅ Completo (MAIL-01) |
| Panel de órdenes + transiciones de estado | ✅ Completo (ADMIN-06) |
| Cuenta del cliente (perfil + órdenes) | ✅ Completo (ACCOUNT-01/02) |
| Importación / SEO / deploy | ✅ Completo (LAUNCH-01..03) |
| Hardening TypeScript estricto | ✅ Completo (QUALITY-01) |

> **Todas las features de `feature_list.json` están en `DONE`.**

**Completadas: 17 features** (INFRA-02..07, DB-01/02, AUTH-01/02, CLOUD-01, ADMIN-AUTH/01..05, SEARCH-01).
Todas compilan, pasan `next build` y están commiteadas una por una (`feat: ...`).

### Nota sobre el panel admin (commits posteriores)
Se migró `/admin` de localStorage/sessionStorage a DB:
- Auth real con NextAuth `requireRole('admin')` (eliminada la password hardcodeada).
- Productos: listado con filtros, toggle activo, form con Cloudinary firmado, specs, slug único, Server Actions.
- Dashboard con métricas reales; categorías (árbol 2 niveles, borrado bloqueado); banners (scheduling); hero/secciones persistidos en `pages`.
- El storefront (home) sigue leyendo de `AdminContext`/estático hasta CAT; por eso los cambios del admin todavía no se reflejan en la home (no rompe nada, es interino).

### Nota sobre búsqueda (SEARCH-01)
API `/api/productos/buscar` con pg_trgm + índice GIN ya funcionando. La página `/buscar` se reconectará al API durante la migración de UI del catálogo.

---

## Lo que se hizo

### INFRA-02 — Validación de variables de entorno (`lib/env.ts`)
Schema Zod que valida todas las env vars. Se separan dos objetos:
- `env` → variables del **servidor** (validación lazy vía Proxy; lanza si se importa desde el cliente).
- `clientEnv` → variables públicas `NEXT_PUBLIC_*` (referenciadas estáticamente para que Next las inline).

Si falta una variable o tiene formato inválido, la app no arranca y muestra cuáles fallaron.
Se crearon `.env.example` (documentado, versionado) y `.env.local` (placeholders para dev/build, gitignoreado).
**Verificado:** rechaza vars faltantes y parsea las válidas.

### INFRA-03 / INFRA-04 — Sistema de errores (`lib/errors`)
- `index.ts`: jerarquía `AppError` + `ValidationError`, `AuthError`, `AuthorizationError`, `NotFoundError`, `RateLimitError`, `PaymentError`, `ShippingError`, cada uno con `code`, `statusCode`, `isOperational`.
- `handlers.ts`: `handleApiError` (operacionales → su statusCode; no operacionales → 500 genérico + Sentry) y `handleServerActionError`.
- `validation.ts`: `formatZodError` + `parseOrThrow`.
- `mp-error-messages.ts`: mapa completo de códigos de MercadoPago → mensajes en español, con `getMpErrorMessage(code)`.

### INFRA-05 / INFRA-06 — Rate limiting + middleware
- `lib/rate-limit/index.ts`: sliding window con Upstash, constantes `RATE_LIMITS` (LOGIN, CHECKOUT, API_PUBLIC, WEBHOOK, SEARCH), `getClientIp` (primera IP de `X-Forwarded-For`).
- `lib/rate-limit/with-rate-limit.ts`: wrapper para API routes que responde 429 con `Retry-After`.
- `middleware.ts`: rate limiting `API_PUBLIC` a `/api/*` (excepto `/api/auth/*`), protección de `/cuenta/*`, security headers (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) y CSP que habilita Checkout Bricks de MP, Cloudinary y Google.

### INFRA-07 — Observabilidad (Sentry + Axiom)
- Sentry 10: `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`, `instrumentation.ts` (con `onRequestError`), `withSentryConfig` en `next.config.ts`. `tracesSampleRate` 0.1 en prod / 1.0 en dev.
- Axiom: `withAxiom` envuelve la config; captura automática de `console.*`.
- `lib/logger`: `logInfo/Warn/Error` con contexto estructurado + `reportException` (import dinámico de Sentry para no inflar el bundle de edge). Inerte sin DSN.

### DB-01 — Schemas Drizzle + migración inicial
16 tablas, cada una en su archivo en `lib/db/schemas/`: users, accounts, sessions, verification_tokens, categories, products, product_images, orders, order_items, payment_events, shipping_quotes, carts, cart_items, pages, banners, mail_logs.
- IDs uuid generados con `crypto.randomUUID()`; dinero en `integer` (centavos); `updatedAt` con `$onUpdate`; soft delete (`deletedAt`) en users/products; `payment_events` append-only sin updatedAt.
- `lib/db/index.ts` (cliente postgres-js serverless, `prepare:false` para el pooler de Supabase, cacheado en dev), `lib/db/types.ts` (tipos inferidos), `drizzle.config.ts`.
- Migración `0000_initial.sql` generada.

### DB-02 — Queries tipadas (`lib/db/queries`)
- `products.ts`: `getProducts` (cursor, filtra `active && !deleted`), `getProductBySlug` (con imágenes y categoría), `getFeaturedProducts`, `decrementStock` (en transacción, desactiva al llegar a 0).
- `categories.ts`: `getCategories` (árbol), `getCategoryBySlug` (con hijos directos).
- `orders.ts`: `createOrder` (transacción, orderNumber `FE-AÑO-NNNN`), `updateOrderStatus` (valida transiciones), `getOrderById` (ownership), `getOrdersByUser` (cursor), tabla `VALID_TRANSITIONS`.
- `cart.ts`: `getCart`, `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart`, `mergeAnonymousCart`, todas con ownership y tope de stock.
- `users.ts`: `getUserByEmailWithHash` (uso interno de auth), `getUserById` (sin passwordHash), `createCredentialsUser`, helpers de password.
- `_cursor.ts`: paginación por cursor opaco sobre `(createdAt, id)`.

### AUTH-01 / AUTH-02 — NextAuth v5 + helpers
- `lib/auth/index.ts`: Google OAuth + Credentials + (invitado a nivel checkout), `DrizzleAdapter`, sesión JWT con `id` y `role`. Credentials con: rate limit LOGIN antes de cualquier query, `bcrypt.compare` siempre (hash dummy) para timing-safe, sin revelar si el email existe.
- `lib/auth/helpers.ts`: `getServerSession`, `requireAuth`, `requireRole`, `isOwner`.
- `lib/auth/actions.ts`: `registerUser` (bcrypt 12 rounds).
- `app/api/auth/[...nextauth]/route.ts`, páginas `/login` y `/registro` (Server Component + form Client con validación Zod inline, error por campo, loading en submit, botón de Google).
- `lib/validations/auth.ts`: schemas login/registro/cambio-password compartidos.

### CLOUD-01 — Uploads firmados a Cloudinary
- `lib/cloudinary/sign.ts`: firma sha1 con el API secret (solo servidor).
- `app/api/admin/cloudinary/sign/route.ts`: POST con rate limiting + `requireRole('admin')`; devuelve `{ signature, timestamp, folder, cloudName, apiKey }`. Nunca expone el secret.
- `lib/cloudinary/transforms.ts`: `transforms` (thumbnail/card/gallery/zoom) + `cloudinaryUrl()`.

---

## Decisiones tomadas

1. **Orden de trabajo por dependencias** (no por orden de los docs): primero todo lo que no requiere UI ni credenciales externas para verificarse (errores → env → DB → rate limit → auth), siguiendo el espíritu del `INDEX.md`. Cada feature se verifica con `tsc --noEmit` y, en los hitos, con `next build`.

2. **Tablas de NextAuth agregadas al modelo:** `accounts` y `verification_tokens` no estaban en `01-database.md` pero el `DrizzleAdapter` las requiere para Google OAuth. Se agregaron como infraestructura.

3. **`sessions` con `sessionToken` como PK** (en vez de `id` uuid PK como decía el doc): es la forma que exige el tipo del `DrizzleAdapter`. Con estrategia JWT esta tabla casi no se usa, así que el desvío no tiene impacto funcional.

4. **Columna `specs jsonb` agregada a `products`:** el modelo de datos no la listaba, pero el formulario de admin (`03-catalog.md`) exige especificaciones técnicas key/value. Sin esa columna la feature de admin no se podría cumplir.

5. **`tsconfig` se mantiene como está por ahora:** los flags estrictos extra de `CLAUDE.md` (`noUncheckedIndexedAccess`, `noImplicitReturns`, `exactOptionalPropertyTypes`) romperían el prototipo existente con decenas de errores. Se activan al final en **QUALITY-01**, limpiando todo de una vez. El código nuevo ya se escribe como si estuvieran activos (indexado defensivo).

6. **Rate limiting fail-open en desarrollo:** con la URL placeholder de Upstash en `.env.local`, el limiter se desactiva para no agregar latencia ni romper el dev server; ante errores de red también falla abierto y loggea un warning. En producción (URL real) queda activo.

7. **Sentry/Axiom inertes sin credenciales:** los `init` están guardados por presencia de DSN, así que en dev no intentan enviar nada y el build no falla por falta de tokens.

8. **Páginas en rutas planas** (`/login`, `/registro`) en vez de los route groups `(auth)` que sugería el doc: el proyecto real ya usa rutas planas (`/carrito`, `/checkout`, `/buscar`), así que se respeta la convención existente del código por encima de la estructura idealizada.

---

## Problemas encontrados y soluciones

1. **`tsx` no cargaba `.env.local` en el smoke test de env.**
   El test inicial falló porque las vars no estaban en el entorno. Solución: ejecutar con `npx tsx --env-file=.env.local`. Confirmó que la validación funciona (rechaza faltantes, parsea válidas).

2. **Augmentación de tipos de NextAuth: `module 'next-auth/jwt' cannot be found`.**
   Con `moduleResolution: "bundler"`, `next-auth/jwt` no está en el mapa de `exports` del paquete aunque el archivo exista. Solución: augmentar `@auth/core/jwt` (el módulo real donde vive la interfaz `JWT`). Las props `id`/`role` se propagan a los callbacks.

3. **`DrizzleAdapter` rechazaba la tabla `sessions`** (`isPrimaryKey: false` en `sessionToken`).
   El tipo del adapter exige `sessionToken` como primary key. Solución: rediseñar `sessions` a la forma estándar (sessionToken PK, sin `id` uuid) y regenerar la migración. Ver decisión #3.

4. **`crypto.randomUUID()` y `Error.captureStackTrace`** podían no existir en todos los runtimes.
   Se usan con optional chaining / asumiendo Node 26 (presente en el entorno). En edge, `crypto` global existe.

5. **Riesgo de inflar el bundle de edge con Sentry** (el logger lo importa y el middleware importa el logger indirectamente).
   Solución: `reportException` hace `import('@sentry/nextjs')` dinámico, así Sentry no entra estáticamente en el bundle de edge.

---

## Lo que falta hacer (y por qué todavía no)

> Razón transversal: de acá en adelante **todas** las features tocan la UI del
> prototipo (que hoy usa datos estáticos, `id` numérico en URLs y precios como
> string) y la migran a la DB real. Es un refactor grande y se hace por capas,
> de abajo (datos/servidor, ya listo) hacia arriba (UI). Por eso primero se
> construyó toda la base y recién ahora se ataca la UI.

### ADMIN-01..05 — Panel admin sobre DB (`pending`)
Migrar `/admin` de `AdminContext` (localStorage) a la DB con Server Actions protegidas por `requireRole('admin')`: listado/alta/edición de productos con upload a Cloudinary y specs key/value, dashboard con métricas reales, categorías (árbol 2 niveles), banners (CRUD + scheduling), hero/secciones persistidos.
**Por qué no aún:** depende de DB-02 y CLOUD-01 (ya listos) y de reemplazar el `AdminContext` actual; es la primera feature de UICon escritura a DB, se hace ahora que la base está completa.

### CAT-02..05 + SEARCH-01 — Catálogo público + búsqueda (`pending`)
Home/categoría/producto leyendo de la DB con ISR (`revalidate 300`), `generateStaticParams`, `generateMetadata`, structured data `Product`, URLs por slug (hoy son por `id`), skeletons y `loading/error/not-found` por segmento. Búsqueda fuzzy con `pg_trgm` vía `GET /api/productos/buscar` (hoy es client-side sobre el array estático).
**Por qué no aún:** requiere migrar las páginas del storefront a Server Components con DB y crear la extensión `pg_trgm` + índice en una migración. Es el segundo gran bloque de UI.

### CART-01 + CHECKOUT-01 + SHIP-01 — Carrito DB, checkout, envíos (`pending`)
Carrito en DB para logueados (Server Actions + SWR) y localStorage para anónimos, con **merge al loguearse** (queda enganchado acá: el callback `signIn` no puede leer localStorage, así que el merge se dispara client-side post-login con `mergeAnonymousCart`, que ya existe). Checkout de 4 pasos con estado en sessionStorage. Cotización real de envíos (`/api/envios/cotizar`) en paralelo a Andreani + Correo Argentino con expiración 30 min.
**Por qué no aún:** depende del catálogo público (para agregar al carrito desde fichas reales) y de credenciales de los carriers; el flujo de checkout alimenta directamente a PAY.

### PAY-01..05 — MercadoPago + webhook (`pending`)
`create-preference` (12 pasos, recálculo de precios en servidor), Checkout Bricks embebido, **webhook idempotente** (firma → payment_events → idempotencia → consulta a MP → transacción con descuento de stock → 200 siempre), página de resultado de orden, cron de cancelación con `CRON_SECRET`, `vercel.json`.
**Por qué no aún:** es el corazón del sistema y depende de checkout (CART/CHECKOUT) y de los mails; además necesita credenciales reales de MP para probarse end-to-end. Se deja para después de tener el flujo de compra armado.

### MAIL-01 — Mails transaccionales (`pending`)
`sendMail` idempotente (tabla `mail_logs`), 5 templates React Email (OrderConfirmation, OrderShipped, OrderDelivered, PaymentFailed, WelcomeEmail), funciones dispatch, y hooks en webhook / `signIn` / Server Actions del admin. El **WelcomeEmail** queda enganchado en el `events.createUser` ya presente en `lib/auth/index.ts`.
**Por qué no aún:** los disparadores viven en el webhook (PAY) y en el panel de órdenes (ADMIN-06), que todavía no existen. Conviene construir el sistema de mail cuando ya estén los puntos donde se invoca.

### ADMIN-06 — Panel de órdenes + transiciones (`pending`)
Listado/detalle de órdenes, timeline, historial de `payment_events`, Server Actions `markAsProcessing/Shipped/Delivered/cancelOrder` con validación de transiciones (ya está `VALID_TRANSITIONS` en queries) y logging.
**Por qué no aún:** necesita órdenes reales generadas por el checkout + webhook (PAY) para tener algo que gestionar; dispara OrderShipped/Delivered (MAIL-01).

### ACCOUNT-01/02 — Cuenta del cliente (`pending`)
`/cuenta/perfil` (editar nombre, email no editable para usuarios Google, cambio de password timing-safe sin enumeración) y `/cuenta/ordenes` + detalle con ownership estricto (`notFound()` si la orden no es del usuario).
**Por qué no aún:** la sección de órdenes necesita órdenes reales (PAY); las queries (`getOrdersByUser`, `getOrderById`) y los helpers de auth ya están listos, así que es relativamente directo una vez que haya datos.

### LAUNCH-01..03 — Importación masiva, SEO, auditoría/deploy (`pending`)
Scripts `generate-categories.ts` + `import-products.ts` (parseo del Excel, categorización por keywords, upsert por SKU en lotes), `sitemap.ts`/`robots.ts`, structured data, checklist de seguridad completo, `vercel.json` (cron + timeout webhook), README.
**Por qué no aún:** la importación llena la DB que consume el catálogo (CAT) y el SEO depende de que las páginas de producto/categoría existan; la auditoría se corre al final, cuando todos los endpoints están implementados.

### QUALITY-01 — TypeScript estricto total + UX transversal (`in progress`)
Activar `noUncheckedIndexedAccess`, `noImplicitReturns`, `exactOptionalPropertyTypes` en `tsconfig` y limpiar todos los errores que aparezcan; revisar Server Components por defecto, skeletons en Suspense y errores siempre visibles.
**Por qué no aún:** activar los flags ahora rompería el prototipo existente con muchos errores en archivos que igual se van a reescribir. Se deja para el cierre, cuando la UI ya esté migrada, y se limpia todo de una sola pasada.

---

## Cómo verificar el estado actual

```bash
# Tipos
npx tsc --noEmit

# Build completo (incluye middleware, rutas de auth, instrumentación)
npx next build

# Regenerar migración desde los schemas
node --env-file=.env.local node_modules/.bin/drizzle-kit generate --name=initial
```

> Nota: `.env.local` tiene valores placeholder. Para conectar servicios reales
> (DB, MP, Cloudinary, Upstash, Resend, carriers, Google OAuth, Sentry/Axiom)
> hay que reemplazarlos por credenciales reales — ver `.env.example`.
