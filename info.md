# info.md — Historia del repositorio

Reconstrucción del trabajo realizado en **Moreno Herramientas** (tienda online de
ferretería argentina, +5.000 productos) a partir del historial de commits real.
Ordenado por fecha en orden ascendente.

El proyecto tuvo dos etapas claramente diferenciadas:

1. **Prototipo frontend** (22 may – 3 jun 2026): una tienda 100% de cara, con datos
   estáticos, sin backend.
2. **Backend de producción** (25 jun – 26 jun 2026): reescritura sistemática feature
   por feature siguiendo el flujo definido en `CLAUDE.md`, migrando todo a base de
   datos real, auth, pagos y deploy.

---

## Etapa 1 — Prototipo frontend (22 may – 3 jun 2026)

En esta etapa se construyó la cáscara visual de la tienda con Next.js. No había DB,
ni auth real, ni pagos: el catálogo era estático, el carrito vivía en `localStorage`
y el admin se protegía con una password hardcodeada en `sessionStorage`.

### 22 may 2026
- **Initial commit from Create Next App** — scaffolding inicial de Next.js.
- **first commit / first commit mine** — primeros commits de arranque del proyecto.
- **added sub-subcategories** — se modeló la jerarquía de categorías con
  sub-subcategorías para organizar el catálogo de ferretería.
  - *Por qué:* una ferretería con miles de productos necesita navegación por
    categorías anidadas para que el comprador encuentre lo que busca.

### 23 may 2026
- **added product page** — página de detalle de producto.

### 28 may 2026
- **added categories and search pages and minor ui changes** — páginas de categoría
  y de búsqueda, más ajustes de UI.
  - *Por qué:* completar los caminos básicos de navegación del storefront (listado
    por categoría + buscador).

### 3 jun 2026
- **added cart view, checkout flow and admin panel** — vista de carrito, flujo de
  checkout (local, sin pago real) y un panel admin inicial.
- **minor ui fix** (x2) — correcciones visuales.
  - *Por qué:* dejar armado el recorrido completo de compra de extremo a extremo a
    nivel visual, aunque sin backend detrás.

> **Estado al cerrar la etapa 1:** prototipo 100% frontend — catálogo estático en
> `lib/products.ts`, carrito en localStorage, admin con password hardcodeada en
> sessionStorage, checkout local sin pago real, sin dependencias de backend.

---

## Etapa 2 — Backend de producción (25 jun – 26 jun 2026)

A partir del 25 de junio se adoptó el **flujo obligatorio por feature** de `CLAUDE.md`:
leer la feature, marcarla `IN_PROGRESS`, implementarla, verificar cada acceptance
criteria explícitamente, marcarla `DONE` y commitearla una por una. El roadmap vive en
`feature_list.json` y el avance en `progress.md`.

### 25 jun 2026 — Infraestructura, DB, auth y admin

#### Setup del workflow
- **chore: workflow de implementación, docs de soporte y dependencias** — se definió
  el flujo por feature en `CLAUDE.md`, se crearon los docs de contexto `01-08` + INDEX,
  el `feature_list.json` (roadmap) y `progress.md`, se instalaron las dependencias
  (Drizzle, Zod, NextAuth, Upstash, Sentry, Axiom, bcryptjs, etc.) y se documentó
  `.env.example`.
  - *Por qué:* establecer el método de trabajo y las herramientas antes de escribir
    backend, para que cada feature fuera verificable y atómica.

#### INFRA-02 — Validación de variables de entorno con Zod
- `lib/env.ts` exporta un objeto tipado validado con Zod desde `process.env`. La app
  falla al arrancar con mensaje claro si falta o es inválida una variable. Separa las
  `NEXT_PUBLIC_*` (cliente) de los secretos del servidor (validación lazy vía Proxy).
  - *Por qué:* evitar arrancar en producción con configuración incompleta y nunca
    filtrar secretos al cliente.

#### INFRA-03/04 — Sistema de errores + mensajes de MercadoPago
- Jerarquía `AppError` (Validation / Auth / Authorization / NotFound / RateLimit /
  Payment / Shipping). `handleApiError` devuelve `{ error: { message, code, details? } }`
  y manda los no operacionales a un 500 genérico. `handleServerActionError` para Server
  Actions. `validation.ts` formatea errores Zod a `{ field, message }[]`.
  `mp-error-messages.ts` traduce códigos de MercadoPago a español. Logger con contexto
  estructurado + `reportException`.
  - *Por qué:* respuestas de error controladas (nunca stack traces al cliente) y
    mensajes de pago entendibles para el comprador.

#### DB-01 — Schemas Drizzle + migración inicial
- 16 tablas (una por archivo en `lib/db/schemas`), tipos inferidos en `types.ts`. IDs
  uuid, **dinero en centavos (integer)**, enum `order_status` (7 estados),
  `shippingAddress` como jsonb tipado, `payment_events` append-only, soft delete en
  users/products, cliente postgres-js serverless, migración `0000`.
  - *Por qué:* base de datos sólida y tipada de punta a punta; dinero en centavos para
    evitar errores de redondeo.

#### DB-02 — Queries tipadas de catálogo, órdenes y carrito
- `getProducts` (cursor) filtra `active=true AND deletedAt IS NULL`; `getProductBySlug`
  con imágenes y categoría; `decrementStock` en transacción; `getOrderById` verifica
  ownership; `createOrder` con `orderNumber` legible; `updateOrderStatus` valida
  transiciones; carrito con ownership y tope de stock. Ninguna query devuelve
  `passwordHash` ni `deletedAt`.
  - *Por qué:* centralizar el acceso a datos con seguridad por diseño (ownership,
    nunca exponer campos sensibles).

#### INFRA-05/06 — Rate limiting + middleware + security headers
- Sliding window con Upstash; `RATE_LIMITS` por tipo (LOGIN/CHECKOUT/API_PUBLIC/
  WEBHOOK/SEARCH); `getClientIp` desde `X-Forwarded-For`; `429` con `Retry-After`.
  Middleware aplica rate limit a `/api/*` (excepto `/api/auth/*`), protege `/cuenta/*`
  y agrega security headers + CSP para Checkout Bricks.
  - *Por qué:* protección contra abuso y fuerza bruta, y cabeceras de seguridad
    compatibles con el pago embebido.

#### INFRA-07 — Observabilidad Sentry + Axiom
- Sentry (`tracesSampleRate` 0.1 prod / 1.0 dev, configs server/edge/client); `withAxiom`
  envuelve `next.config`; `reportException` manda a Sentry solo no operacionales e
  inerte sin DSN.
  - *Por qué:* visibilidad de errores y logs en producción sin romper en desarrollo.

#### AUTH-01/02 — NextAuth v5 + helpers de autorización
- Google OAuth + Credentials + invitado; JWT con `id` y `role`; DrizzleAdapter.
  Credentials con rate limit LOGIN previo, `bcrypt.compare` timing-safe con hash dummy
  y sin revelar si el email existe. Helpers `requireAuth` / `requireRole` / `isOwner`.
  Páginas `/login` y `/registro` con validación Zod inline; `registerUser` con bcrypt 12.
  - *Por qué:* autenticación segura con tres modos de compra (cuenta Google, credentials
    o invitado) y defensa contra enumeración de usuarios.

#### CLOUD-01 — Uploads firmados a Cloudinary
- `/api/admin/cloudinary/sign` con `requireRole('admin')` + rate limiting; firma sha1
  con `CLOUDINARY_API_SECRET` (solo servidor); transforms thumbnail/card/gallery/zoom +
  `cloudinaryUrl()`.
  - *Por qué:* subir imágenes sin exponer nunca el secret de Cloudinary al cliente.

#### ADMIN-AUTH — Auth real del panel + shell
- Layout server-side que gatea `/admin` por rol admin (redirige a `/login` o `/`),
  `AdminShell` cliente con sidebar y signOut. **Se eliminó el login hardcodeado** (la
  password en cliente + sessionStorage del prototipo).
  - *Por qué:* el admin del prototipo no era seguro; ahora usa NextAuth real.

#### ADMIN-01 — Gestión de productos sobre DB
- Listado paginado con búsqueda (nombre/SKU/marca) y filtros; toggle activo inline;
  soft delete con confirmación; form con slug único auto, specs key/value dinámicas,
  imágenes Cloudinary firmadas con principal y reorden, regla stock 0 → inactivo;
  Server Actions con `requireRole('admin')`, Zod y `revalidatePath`; mapeo de
  SKU/slug duplicado a error por campo.

#### ADMIN-02 — Dashboard con métricas reales
- Server Component (`revalidate` 60) con métricas del día (órdenes nuevas, ingresos,
  a procesar, sin stock) y accesos directos.

#### ADMIN-04 — Gestión de categorías sobre DB
- Árbol de hasta 2 niveles, crear/editar/reordenar, slug único auto, bloqueo de borrado
  si la categoría tiene productos o subcategorías.

#### ADMIN-05 — Gestión de banners sobre DB
- CRUD con imagen firmada + preview, campos de scheduling (`startsAt`/`endsAt`),
  `getActiveBanners` filtra por ventana de fechas para el storefront.

#### ADMIN-03 — Hero y secciones destacadas sobre DB
- Config del home persistida en la tabla `pages` (slug `home`), no en localStorage:
  hero (imagen + título + CTA) y secciones con productos destacados desde la DB;
  `revalidatePath('/')` al guardar. Se eliminó `/admin/reportes` (lo reemplaza el
  dashboard).
  - *Por qué (bloque admin):* migrar todo el panel de localStorage/sessionStorage a DB
    real, con autorización por rol y persistencia consistente.

#### SEARCH-01 — Búsqueda fuzzy con pg_trgm
- Migración `pg_trgm` + índices GIN (name, brand); `GET /api/productos/buscar` con
  rate limiting SEARCH y params Zod; filtros categoría/precio; orden por similaridad;
  respuesta con cursor.
  - *Por qué:* búsqueda tolerante a errores de tipeo sobre miles de productos.

#### CAT-02..05 — Catálogo público sobre DB con ISR
- Migración del storefront de datos estáticos a la DB (cambio atómico junto con el
  carrito, que comparte el tipo `Product`):
  - **CAT-02 Home:** Server Component ISR 300; hero + destacados + categorías reales.
  - **CAT-03 `/categoria/[slug]`:** ISR 300 + `generateStaticParams`, subcategorías,
    paginación, `notFound()`.
  - **CAT-04 `/producto/[slug]`:** URL por slug, ISR + `generateStaticParams(200)`,
    `generateMetadata`, structured data Product (precio ARS, availability), galería,
    specs, relacionados, WhatsApp.
  - **CAT-05 Skeletons** + loading/not-found/error por segmento.
  - `/buscar` reconectado a la búsqueda DB; carrito reformado a la forma DB (uuid,
    centavos) en localStorage.
  - Se eliminaron `lib/products`, `lib/search`, `AdminContext` y `producto/[id]`.
  - *Por qué:* que la tienda pública refleje datos reales editables desde el admin, con
    ISR para performance + SEO.

#### CART-01 — Carrito de compras
- Logueados: carrito en DB (`carts` + `cart_items`) vía Server Actions; anónimos:
  localStorage + cookie `anon_cart`; merge al loguearse (`mergeAnonymousCartAction`).
  Tope de stock al agregar/actualizar (server + cliente) con aviso si el stock cambió;
  cada Server Action hace `requireAuth` y opera solo sobre el carrito propio (ownership
  por `itemId`); `CartDrawer` global con contador optimista.
  - *Por qué:* carrito persistente y seguro para usuarios, sin perder el carrito de los
    anónimos al registrarse.

### 26 jun 2026 — Checkout, pagos, mails, órdenes, cuenta y lanzamiento

#### SHIP-01 — Cotización de envíos Andreani + Correo Argentino
- `quoteShipping` cotiza **en paralelo** (`Promise.allSettled`) a ambos carriers; si uno
  falla devuelve el otro, si ambos fallan lanza `ShippingError`. Guarda cotizaciones en
  `shipping_quotes` con `expiresAt` 30min, ordenadas por precio. `POST /api/envios/cotizar`
  valida CP con Zod y **recalcula los items desde la DB** (nunca confía en el precio del
  cliente). Credenciales solo en servidor; con placeholders usa estimación determinística
  en dev. `ShippingSelector` con skeleton, timeout 10s y reintento. Carriers vía REST
  fetch (sin SDK).
  - *Por qué:* darle al comprador opciones de envío reales sin acoplarse a un solo carrier
    ni confiar en datos del cliente.

#### CHECKOUT-01 — Flujo de checkout multi-paso
- 4 pasos (comprador → dirección → envío → pago) con estado en `sessionStorage`
  (`useCheckoutState`) que sobrevive recargas; redirige a `/carrito` si está vacío;
  datos prellenados desde la sesión; validación Zod inline por campo en blur; CP válido
  dispara cotización; resumen sticky con subtotal + envío + total.
  - *Por qué:* guiar el pago paso a paso sin perder datos y mostrando siempre el total real.

#### PAY-01..05 — MercadoPago (preferencia, Bricks, webhook, orden, cron)
- **PAY-01 create-preference:** orden de seguridad rate limiting CHECKOUT → Zod →
  **recálculo de TODOS los precios desde la DB**; verifica stock y vigencia de la
  cotización antes de crear la orden `pending`; total = items + envío en servidor; crea
  la preferencia MP (`external_reference`, expiración 30min, `notification_url`).
- **PAY-02 Bricks:** Wallet Brick con `preferenceId`, skeleton, `onError` mapeado.
- **PAY-03 webhook (crítico):** valida `x-signature` antes de todo; guarda en
  `payment_events` (append-only); idempotencia por `paymentId`; consulta el pago real en
  MP; approved → transacción (confirmed + stock-- + active=false al llegar a 0 +
  `revalidatePath` + limpia carrito) y mail fire-and-forget; rejected → cancelled; **siempre 200**.
- **PAY-04 `/orden/[id]`:** lee el estado real de la DB (ignora el query de MP), ownership
  por userId o capability del uuid para invitados.
- **PAY-05 cron `/api/cron/cancelar-ordenes-pendientes`:** Bearer `CRON_SECRET`, cancela
  pendientes >30min; `vercel.json` con schedule `*/5`. MP vía REST fetch (sin SDK).
  - *Por qué:* **el stock se descuenta solo en el webhook**, los precios se recalculan en
    servidor y la orden nunca se crea si algo falla antes — exactamente las reglas de oro
    de seguridad del proyecto. La idempotencia evita doble cobro/doble descuento ante
    webhooks repetidos.

#### MAIL-01 — Mails transaccionales con idempotencia
- `sendMail` idempotente (reclama la `idempotencyKey` de forma atómica vía `mail_logs`
  antes de enviar; en dev loggea el HTML y no envía); 5 templates (OrderConfirmation,
  OrderShipped, OrderDelivered, PaymentFailed, WelcomeEmail) responsive en HTML inline;
  5 dispatch tipados que leen de la DB y no propagan errores; hooks fire-and-forget
  enganchados en el webhook MP y en `createUser`. El mail se envía una sola vez aunque
  el webhook llegue duplicado.
  - *Por qué:* notificar al comprador sin riesgo de mails duplicados ni de tirar abajo el
    webhook si el envío falla.

#### ADMIN-06 — Panel de órdenes y transiciones de estado
- `/admin/ordenes` con filtros por estado/fecha, búsqueda por número o email, paginación
  server-side; `/admin/ordenes/[id]` con detalle, timeline e historial de `payment_events`.
  Server Actions `markAsProcessing/Shipped/Delivered` y `cancelOrder` con
  `requireRole('admin')` que validan la transición (`updateOrderStatus` rechaza las
  inválidas); `markAsShipped` exige tracking + carrier y dispara `onOrderShipped`;
  `cancelOrder` solo desde pending/confirmed y nunca si `mpStatus==='approved'`. Cada
  acción loggea adminId/orderId/estado.
  - *Por qué:* operar las órdenes con una máquina de estados segura y auditable.

#### ACCOUNT-01/02 — Cuenta del cliente (perfil + órdenes)
- **Perfil:** edición de nombre; email read-only; cambio de password solo para cuentas
  credentials (`changePassword` valida la actual con bcrypt timing-safe, hashea con 12
  rounds e invalida la sesión). **Órdenes:** historial **siempre filtrado por userId**,
  paginado por cursor; detalle con ownership vía `getOrderById(id, userId)` que hace
  `notFound()` (no 403) si no es del usuario; tracking con link al carrier y `mpDetail`
  traducido. `/cuenta` protegido por middleware con `callbackUrl`.
  - *Por qué:* darle al cliente su historial y perfil sin que pueda ver órdenes ajenas.

#### LAUNCH-01..03 — Importación masiva, SEO y deploy
- **LAUNCH-01 importación:** `scripts/generate-categories.ts` (idempotente) y
  `scripts/import-products.ts` (parser CSV propio, extrae precio con regex, mapea
  Código→SKU y Departamento→brand, categoriza por keywords, lotes de 100 con
  `ON CONFLICT (sku) DO UPDATE`, slug único, errores a `import-errors.log` y
  `import-report.txt`).
- **LAUNCH-02 SEO:** `sitemap.ts` dinámico, `robots.ts` que bloquea zonas privadas,
  structured data Product + BreadcrumbList + WebSite/SearchAction.
- **LAUNCH-03 deploy/auditoría:** `vercel.json` (cron + maxDuration del webhook) y README
  con scripts, env vars, sandbox vs producción de MP y checklist de auditoría de seguridad.
  - *Por qué:* cargar los +5.000 productos del Excel real, ser indexable en Google y dejar
    el proyecto desplegable en Vercel.

#### QUALITY-01 — TypeScript estricto total + cleanup transversal
- `tsconfig` con `strict` + `noUncheckedIndexedAccess` + `noImplicitReturns` +
  `exactOptionalPropertyTypes`; se resolvieron los 36 errores que surgieron al activar los
  flags; sin `any` nuevo ni `as unknown as X` sin documentar (único caso documentado: el
  singleton del cliente DB).
  - *Por qué:* cerrar el proyecto con el modo estricto total que exige `CLAUDE.md`,
    eliminando clases enteras de bugs en tiempo de compilación.

---

## Estado final (26 jun 2026)

Según `progress.md` y `feature_list.json`, **todas las features están en `DONE`**. El
proyecto pasó de un prototipo frontend sin backend a una tienda de producción con:

- Base de datos PostgreSQL/Drizzle con dinero en centavos y soft deletes.
- Auth NextAuth (Google + credentials + invitado) con autorización por rol.
- Panel admin completo sobre DB (productos, categorías, banners, hero, dashboard, órdenes).
- Catálogo público con ISR + SEO + búsqueda fuzzy.
- Carrito DB/anónimo con merge, checkout multi-paso y cotización de envíos multi-carrier.
- Pagos MercadoPago con webhook idempotente (stock descontado solo al confirmar).
- Mails transaccionales idempotentes.
- Cuenta del cliente, importación masiva, observabilidad y deploy en Vercel.
- TypeScript en modo estricto total, `tsc --noEmit` y `next build` en verde.

> Todo lo descripto en este archivo corresponde a commits y código efectivamente
> presentes en el repositorio; no incluye trabajo planificado pero no realizado.
