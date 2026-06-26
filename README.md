# Moreno Herramientas

Tienda online para ferretería argentina (+5.000 productos). Next.js 16 (App
Router, RSC), TypeScript estricto, Tailwind v4, Drizzle + PostgreSQL (Supabase),
NextAuth v5, MercadoPago Checkout Bricks, Andreani + Correo Argentino, Resend,
Cloudinary, Upstash, Sentry + Axiom.

## Desarrollo

```bash
npm run dev          # servidor de desarrollo
npx tsc --noEmit     # chequeo de tipos
npm run lint         # eslint
npx next build       # build de producción
```

`.env.local` trae valores **placeholder** (prefijo `dev-`) para que el build y el
dev server funcionen sin servicios externos. El rate limiting, los carriers de
envío y los mails detectan los placeholders y caen en modo fail-soft (no pegan a
las APIs reales). Reemplazá por credenciales reales para conectar los servicios.

## Importación masiva de productos

El archivo del proveedor (Excel) trae las columnas `Código`, `Producto`
(con el precio embebido como `NOMBRE /PRECIO/`), `Departamento` (marca) y
`Existencia` (stock). Exportalo a CSV UTF-8 y corré, **en este orden**:

```bash
# 1. Crea las categorías predefinidas (idempotente)
npx tsx --env-file=.env.local scripts/generate-categories.ts

# 2. Importa los productos (lotes de 100, upsert por SKU)
npx tsx --env-file=.env.local scripts/import-products.ts ./data/STOCK.csv
```

El import genera `import-report.txt` (procesadas / insertados / actualizados /
errores) e `import-errors.log` (filas sin precio o sin código). Categoriza por
palabras clave; lo que no matchea va a `sin-categorizar`. El slug se hace único
agregando el SKU ante conflicto.

## Variables de entorno

Validadas con Zod en `lib/env.ts` (el arranque falla si falta alguna). Ver
`.env.example` para la lista completa con ejemplos. Las `NEXT_PUBLIC_*` son las
únicas seguras en el cliente; el resto vive solo en el servidor.

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

- **Sandbox** (desarrollo/pruebas): `MP_ACCESS_TOKEN` y `NEXT_PUBLIC_MP_PUBLIC_KEY`
  con prefijo `TEST-`. Los pagos usan tarjetas de prueba; no hay cargos reales.
- **Producción**: credenciales productivas (sin `TEST-`). Configurar el
  `MP_WEBHOOK_SECRET` real para validar la firma `x-signature` del webhook.
- El `notification_url` de la preferencia apunta a
  `NEXT_PUBLIC_APP_URL/api/webhooks/mercadopago`: en producción debe ser HTTPS y
  accesible públicamente.

## Deploy en Vercel

`vercel.json` configura:

- **Cron** `*/5 * * * *` → `/api/cron/cancelar-ordenes-pendientes` (cancela
  órdenes `pending` de más de 30 min; requiere `Authorization: Bearer CRON_SECRET`).
- **maxDuration 30s** para el webhook de MercadoPago.

Variables a setear en Vercel: todas las de la tabla, con `NEXTAUTH_URL` igual a la
URL de producción **sin slash final** y `CRON_SECRET` aleatorio de ≥32 caracteres.

## Auditoría de seguridad (checklist 08-launch.md)

- **Autorización**: las órdenes se filtran SIEMPRE por `userId`
  (`getOrderById`/`getOrdersByUser`); `/cuenta/ordenes/[id]` ajena → `notFound()`
  (404, no revela existencia). `/admin/*` exige `role = admin` (layout +
  `requireRole`). `/admin` sin admin redirige.
- **Precios y pagos**: el checkout recalcula TODOS los precios desde la DB
  (`lib/checkout/pricing.ts`); el stock se descuenta SOLO en el webhook, dentro de
  una transacción; la firma de MP se valida ANTES de cualquier operación.
- **Rate limiting**: 5 logins/IP cada 15 min, 60 req/min a `/api/*` (middleware),
  CHECKOUT en create-preference.
- **Datos sensibles**: `MP_ACCESS_TOKEN`, secretos de Cloudinary y credenciales de
  carriers viven solo en el servidor (`lib/env` con Proxy que falla si se importa
  desde el cliente); `passwordHash` nunca se devuelve (`safeColumns`).
- **Config**: `.env*` fuera del repo (`.gitignore`); security headers + CSP en
  `middleware.ts`; HTTPS forzado en producción por Vercel.
