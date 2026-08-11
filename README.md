# Moreno Herramientas

Tienda online (e-commerce) para una **ferretería argentina con +5.000 productos**.
Storefront público + panel de administración propio en `/admin`. Permite comprar con
cuenta registrada (Google o email/contraseña) o como invitado, con pago real por
MercadoPago y cotización de envíos a domicilio.

> Para el detalle cronológico de cómo se construyó el proyecto (commit por commit, con
> el porqué de cada feature) ver **[`info.md`](./info.md)**. El roadmap formal con los
> acceptance criteria de cada feature está en **[`feature_list.json`](./feature_list.json)**
> y el seguimiento en **[`progress.md`](./progress.md)**.

---

## Stack

| Área | Tecnología |
|---|---|
| Framework | Next.js 16 — App Router, React Server Components |
| Lenguaje | TypeScript 5 — modo estricto total |
| Estilos | Tailwind CSS v4 — sin UI libraries de terceros |
| Auth | NextAuth v5 — Google OAuth + credentials + invitado |
| Base de datos | PostgreSQL en Supabase (solo DB) |
| ORM | Drizzle ORM |
| Imágenes | Cloudinary — uploads firmados + transformaciones por URL |
| Pagos | MercadoPago Checkout Bricks |
| Envíos | Andreani + Correo Argentino |
| Mails | Resend (HTML inline) |
| Deploy | Vercel |
| Validación | Zod — cliente, servidor y variables de entorno |
| Rate limiting | Upstash Redis |
| Monitoreo | Sentry (errores) + Axiom (logs) |

---

## Arquitectura en una imagen

```
app/
├── (store)/       Storefront público (home, categoría, producto, búsqueda, carrito, checkout, orden)
├── (auth)/        Login y registro
├── cuenta/        Perfil + historial de órdenes del cliente (protegido)
├── admin/         Panel admin (protegido por rol admin)
└── api/
    ├── auth/                       NextAuth
    ├── admin/cloudinary/sign       Firma de uploads (solo admin)
    ├── productos/buscar            Búsqueda fuzzy pg_trgm
    ├── envios/cotizar              Cotización multi-carrier
    ├── checkout/create-preference  Preferencia de pago (recalcula precios)
    ├── webhooks/mercadopago        Webhook de pago (descuenta stock)
    └── cron/cancelar-ordenes-pendientes

lib/   db (schemas + queries) · auth · payments · shipping · mail · cloudinary ·
       validations · errors · logger · rate-limit · checkout · utils
```

Principios transversales:
- **Server Components por defecto**; `'use client'` solo donde hay interactividad real.
- **Dinero siempre en centavos** (integer) en la DB para evitar errores de redondeo.
- **Seguridad por diseño** en cada API route: rate limit → auth → autorización →
  validación Zod → lógica → respuesta controlada.

---

## Qué se construyó y por qué

El proyecto pasó por dos etapas (detalle completo en `info.md`):

**Etapa 1 — Prototipo frontend (mayo–junio 2026).** Cáscara visual de la tienda con
catálogo estático, carrito en `localStorage`, admin con password hardcodeada y checkout
local sin pago real. Sirvió para validar UX y navegación por categorías anidadas.

**Etapa 2 — Backend de producción (25–26 junio 2026).** Reescritura sistemática feature
por feature siguiendo el flujo de `CLAUDE.md`, migrando todo a infraestructura real:

| Bloque | Qué se hizo | Por qué |
|---|---|---|
| **Infra** (INFRA-02..07) | Validación de env con Zod, jerarquía de errores, rate limiting Upstash, middleware + security headers + CSP, Sentry + Axiom | Arrancar nunca con config inválida, respuestas de error controladas, protección contra abuso y visibilidad en producción |
| **DB** (DB-01/02) | 16 tablas Drizzle (dinero en centavos, `order_status` de 7 estados, `payment_events` append-only, soft deletes) + queries tipadas con ownership | Modelo de datos sólido y acceso seguro que nunca expone `passwordHash`/`deletedAt` |
| **Auth** (AUTH-01/02, ADMIN-AUTH) | NextAuth v5 (Google + credentials + invitado), JWT con rol, helpers `requireAuth`/`requireRole`/`isOwner`, login admin real | Tres modos de compra y autorización por rol; se eliminó la password hardcodeada del prototipo |
| **Cloudinary** (CLOUD-01) | Uploads firmados desde el servidor + transforms por URL | Subir imágenes sin exponer nunca el `API_SECRET` |
| **Admin** (ADMIN-01..06) | Productos, dashboard, categorías (árbol 2 niveles), banners (scheduling), hero/secciones y órdenes con máquina de estados auditable | Operar la tienda sobre DB real con autorización y persistencia consistente |
| **Catálogo** (CAT-02..05, SEARCH-01) | Home/categoría/producto con ISR + `generateStaticParams` + structured data, skeletons y búsqueda fuzzy con `pg_trgm` | Tienda pública rápida, indexable y tolerante a errores de tipeo sobre miles de productos |
| **Carrito** (CART-01) | DB para logueados + localStorage/cookie para anónimos, merge al loguearse, tope de stock, `CartDrawer` global | Carrito persistente y seguro sin perder el de los invitados al registrarse |
| **Checkout + envíos** (CHECKOUT-01, SHIP-01) | Checkout de 4 pasos con estado en `sessionStorage`; cotización en paralelo a Andreani + Correo (`Promise.allSettled`) recalculando ítems desde la DB | Guiar el pago paso a paso y dar opciones de envío reales sin confiar en datos del cliente |
| **Pagos** (PAY-01..05) | Preferencia con recálculo total en server, Wallet Brick, webhook idempotente que valida firma y descuenta stock en transacción, página de resultado por estado real y cron de cancelación | **El stock se descuenta solo al confirmar el pago**; idempotencia evita doble cobro/descuento |
| **Mails** (MAIL-01) | `sendMail` idempotente vía `mail_logs` + 5 templates, hooks fire-and-forget | Notificar sin mails duplicados ni tirar abajo el webhook si el envío falla |
| **Cuenta** (ACCOUNT-01/02) | Perfil + cambio de password (bcrypt timing-safe) e historial filtrado siempre por `userId` | El cliente ve lo suyo y nunca órdenes ajenas (`notFound()` en vez de 403) |
| **Lanzamiento** (LAUNCH-01..03) | Import masivo desde Excel/CSV (upsert por SKU), sitemap/robots/structured data, `vercel.json` + checklist de auditoría | Cargar los +5.000 productos reales, ser indexable y quedar desplegable |
| **Calidad** (QUALITY-01) | `strict` + `noUncheckedIndexedAccess` + `noImplicitReturns` + `exactOptionalPropertyTypes`, 0 errores de `tsc` | Cerrar el proyecto con el modo estricto total que exige `CLAUDE.md` |

---

## Roadmap

**Las 40 features de `feature_list.json` están en `DONE`.** El roadmap planificado se
completó; `tsc --noEmit`, `eslint` y `next build` pasan en verde.

```
✅ Infraestructura (env, errores, rate limit, middleware, observabilidad)   INFRA-02..07
✅ Base de datos (schemas + queries tipadas)                                DB-01/02
✅ Autenticación + autorización + uploads firmados                          AUTH-01/02, CLOUD-01
✅ Panel admin sobre DB (auth, productos, dashboard, categorías, banners,   ADMIN-AUTH/01..06
   hero, órdenes)
✅ Catálogo público con ISR + búsqueda fuzzy                                 CAT-02..05, SEARCH-01
✅ Carrito (DB + anónimo con merge)                                          CART-01
✅ Checkout multi-paso + cotización de envíos                                CHECKOUT-01, SHIP-01
✅ MercadoPago (preferencia + Bricks + webhook + orden + cron)               PAY-01..05
✅ Mails transaccionales idempotentes                                        MAIL-01
✅ Cuenta del cliente (perfil + órdenes)                                     ACCOUNT-01/02
✅ Importación masiva + SEO + deploy                                         LAUNCH-01..03
✅ TypeScript estricto total                                                 QUALITY-01
```

---

## Qué falta (pendientes operativos, fuera del roadmap de features)

El código de las features está completo; lo pendiente es la puesta en producción real y
no está representado como features en `feature_list.json`:

- **Credenciales reales.** `.env.local` trae placeholders (prefijo `dev-`/`TEST-`); hay
  que cargar credenciales productivas de Supabase, MercadoPago, Cloudinary, Resend,
  Upstash, Andreani/Correo, Google OAuth, Sentry y Axiom.
- **Carga del catálogo real.** Correr los scripts de importación con el Excel del
  proveedor (los +5.000 productos todavía no están en la DB del repo).
- **Conexión real de carriers.** Con placeholders, los envíos usan estimación
  determinística; falta validar la integración real con Andreani y Correo Argentino.
- **Verificación end-to-end con servicios reales.** El flujo se verificó con
  `tsc`/`eslint`/`build` y lógica fail-soft en dev; falta un pase de QA con un pago de
  sandbox→producción real, webhook entrante por HTTPS y envío real de mails.
- **Suite de tests automatizada.** Hay Playwright como dependencia pero no una batería
  de tests E2E/unitarios versionada.
- **Deploy efectivo en Vercel** con las env vars cargadas y el cron activo.

> Este apartado refleja únicamente lo que el código y los commits muestran como hecho/no
> hecho; no incluye features inventadas.

---

## Desarrollo

```bash
npm run dev          # servidor de desarrollo
npx tsc --noEmit     # chequeo de tipos
npm run lint         # eslint
npx next build       # build de producción
```

`.env.local` trae valores **placeholder** (prefijo `dev-`) para que el build y el dev
server funcionen sin servicios externos. El rate limiting, los carriers de envío y los
mails detectan los placeholders y caen en modo **fail-soft** (no pegan a las APIs
reales). Reemplazá por credenciales reales para conectar los servicios.

---

## Importación masiva de productos

El archivo del proveedor (Excel) trae las columnas `Código`, `Producto` (con el **precio
de costo** embebido como `NOMBRE /COSTO/`), `Departamento` (marca), `P. Venta` y
`Existencia` (stock). Solo se publican las filas con `Existencia > 0`, y el precio que
sale al público es `P. Venta` — nunca el costo embebido en el nombre.

Exportalo a CSV UTF-8 a `data/stock-raw.csv` y corré, **en este orden**:

```bash
# 1. Limpia nombres, saca códigos y notas internas → data/productos-limpios.json
npx tsx --env-file=.env.local scripts/clean-stock.ts

# 2. Inserta/actualiza por SKU (idempotente, acepta --dry-run)
npx tsx --env-file=.env.local scripts/import-stock.ts

# 3. Specs técnicas (catálogo de marca + derivadas del nombre)
npx tsx --env-file=.env.local scripts/apply-specs.ts

# 4. Crea la taxonomía y asigna categoría a cada producto
npx tsx --env-file=.env.local scripts/apply-categories.ts
```

Cada paso deja su reporte en `data/` (`reporte-limpieza.txt`, `reporte-specs.txt`,
`reporte-categorias.txt`). Lo que no matchea ninguna regla va a `sin-categorizar`. El
mismo pipeline es el camino para refrescar precios y stock cuando llega una planilla
nueva. Detalle completo del pipeline y de las trampas de los datos en `CLAUDE.md`.

---

## Variables de entorno

Validadas con Zod en `lib/env.ts` (el arranque falla si falta alguna). Ver `.env.example`
para la lista completa con ejemplos. Las `NEXT_PUBLIC_*` son las únicas seguras en el
cliente; el resto vive solo en el servidor.

| Grupo | Variables |
|---|---|
| DB | `DATABASE_URL` |
| Auth | `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID/SECRET` |
| MercadoPago | `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `NEXT_PUBLIC_MP_PUBLIC_KEY` |
| Envíos | `ANDREANI_API_KEY/CLIENT_ID`, `CORREO_ARG_USER/PASSWORD` |
| Mails | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |
| Rate limit | `UPSTASH_REDIS_URL/TOKEN` |
| App | `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` (≥32 chars) |
| Monitoreo | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_*`, `AXIOM_*` |

### MercadoPago: sandbox vs producción

- **Sandbox** (desarrollo/pruebas): `MP_ACCESS_TOKEN` y `NEXT_PUBLIC_MP_PUBLIC_KEY` con
  prefijo `TEST-`. Los pagos usan tarjetas de prueba; no hay cargos reales.
- **Producción**: credenciales productivas (sin `TEST-`). Configurar el `MP_WEBHOOK_SECRET`
  real para validar la firma `x-signature` del webhook.
- El `notification_url` de la preferencia apunta a
  `NEXT_PUBLIC_APP_URL/api/webhooks/mercadopago`: en producción debe ser HTTPS y
  accesible públicamente.

---

## Deploy en Vercel

`vercel.json` configura:

- **Cron** `*/5 * * * *` → `/api/cron/cancelar-ordenes-pendientes` (cancela órdenes
  `pending` de más de 30 min; requiere `Authorization: Bearer CRON_SECRET`).
- **maxDuration 30s** para el webhook de MercadoPago.

Variables a setear en Vercel: todas las de la tabla, con `NEXTAUTH_URL` igual a la URL de
producción **sin slash final** y `CRON_SECRET` aleatorio de ≥32 caracteres.

---

## Auditoría de seguridad

- **Autorización**: las órdenes se filtran SIEMPRE por `userId`
  (`getOrderById`/`getOrdersByUser`); `/cuenta/ordenes/[id]` ajena → `notFound()`
  (404, no revela existencia). `/admin/*` exige `role = admin` (layout + `requireRole`).
- **Precios y pagos**: el checkout recalcula TODOS los precios desde la DB
  (`lib/checkout/pricing.ts`); el stock se descuenta SOLO en el webhook, dentro de una
  transacción; la firma de MP se valida ANTES de cualquier operación.
- **Rate limiting**: 5 logins/IP cada 15 min, 60 req/min a `/api/*` (middleware),
  CHECKOUT en create-preference.
- **Datos sensibles**: `MP_ACCESS_TOKEN`, secretos de Cloudinary y credenciales de
  carriers viven solo en el servidor (`lib/env` con Proxy que falla si se importa desde
  el cliente); `passwordHash` nunca se devuelve (`safeColumns`).
- **Config**: `.env*` fuera del repo (`.gitignore`); security headers + CSP en
  `middleware.ts`; HTTPS forzado en producción por Vercel.

---

## Documentación del proyecto

| Archivo | Contenido |
|---|---|
| `CLAUDE.md` | Contexto global, stack, convenciones y flujo de implementación por feature |
| `info.md` | Historia cronológica del repo (commit por commit, con el porqué) |
| `feature_list.json` | Roadmap formal con acceptance criteria por feature |
| `progress.md` | Seguimiento del avance feature por feature |
| `DESIGN.md` | Sistema de diseño y tokens |
| `docs/claude/01-08` | Documentos de soporte por área (DB, seguridad, catálogo, checkout, mails, admin, cuenta, launch) |
