# CLAUDE.md — Contexto global

## Sistema de implementación de features

Tu tarea es implementar las features de `feature-list.json` en orden,
una por una. Seguí este flujo sin excepción:

### Flujo obligatorio por feature

1. **Leer** la feature completa: descripción, acceptance criteria y
   cualquier documento de soporte referenciado
2. **Marcar** la feature como `IN_PROGRESS` en `feature-list.json`
3. **Implementar** la feature
4. **Verificar** cada acceptance criteria uno por uno — explicitá
   cuál pasa y cuál no en tu respuesta
5. Si algún AC no pasa: **corregir** e ir al paso 4 de nuevo
6. Solo cuando **todos los AC pasen**: marcar como `DONE`
7. **Commitear** con el mensaje: `feat: [nombre de la feature]`
   Incluir en el cuerpo del commit los ACs que cubre
8. **No avanzar** a la siguiente feature hasta completar el paso 7

### Reglas

- Solo una feature puede estar `IN_PROGRESS` a la vez
- Nunca marcar `DONE` sin haber verificado todos los AC explícitamente
- Si un AC es ambiguo, preguntar antes de implementar, no asumir
- Si la implementación de una feature rompe algo existente,
  resolverlo antes de marcar `DONE`
- Los documentos de soporte están en `docs/claude/`

### Estados válidos en feature-list.json

```
"status": "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED"
```

Usar `BLOCKED` si hay una dependencia externa que impide avanzar,
documentando el motivo en el campo `blockedReason`.

## El proyecto

Tienda online para ferretería argentina (+5.000 productos).
Panel admin propio en /admin. Compradores con o sin cuenta registrada.

---

## Stack

| Área | Tecnología |
|---|---|
| Framework | Next.js 16 — App Router, React Server Components |
| Lenguaje | TypeScript 5 — modo estricto total |
| Estilos | Tailwind CSS v4 — sin UI libraries de terceros |
| Auth | NextAuth v5 — Google OAuth + credentials + invitado |
| Base de datos | PostgreSQL en Supabase (solo DB, no Auth ni Storage) |
| ORM | Drizzle ORM |
| Imágenes | Cloudinary — uploads firmados + transformaciones por URL |
| Pagos | MercadoPago Checkout Bricks |
| Envíos | Andreani + Correo Argentino |
| Mails | Resend + React Email |
| Deploy | Vercel |
| Validación | Zod — cliente, servidor y variables de entorno |
| Rate limiting | Upstash Redis |
| Monitoreo de errores | Sentry |
| Logs | Axiom (next-axiom) |

---

## Estructura de directorios

```
/
├── app/
│   ├── (store)/          → Storefront público
│   ├── (auth)/           → Login y registro
│   ├── admin/            → Panel admin propio (protegido por rol)
│   └── api/
│       ├── auth/
│       ├── admin/
│       ├── checkout/
│       ├── webhooks/mercadopago/
│       ├── envios/
│       ├── cron/
│       └── productos/
├── components/
│   ├── ui/               → Primitivos propios
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   ├── admin/
│   └── feedback/         → Toast, Skeleton, ErrorBoundary
├── lib/
│   ├── db/               → Drizzle client + schemas + migraciones
│   ├── auth/
│   ├── payments/
│   ├── shipping/
│   ├── mail/
│   ├── cloudinary/
│   ├── validations/      → Schemas Zod compartidos
│   ├── errors/           → Jerarquía de errores custom
│   ├── logger/           → Axiom + Sentry helpers
│   ├── rate-limit/
│   └── utils/
├── scripts/              → Importación masiva, seeds
└── middleware.ts
```

---

## TypeScript — sin excepciones

```
{ "strict": true, "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true, "exactOptionalPropertyTypes": true }
```

- Sin `any`. Sin `as unknown as X` salvo casos documentados.
- Tipos de Drizzle exportados desde `lib/db/types.ts`.
- Props siempre tipadas con interfaces explícitas.

---

## Seguridad — orden obligatorio en toda API route

```typescript
export async function POST(request: Request) {
  try {
    // 1. Rate limiting
    // 2. Autenticación
    // 3. Autorización
    // 4. Validación Zod del body
    // 5. Lógica de negocio
    // 6. Respuesta controlada
  } catch (error) {
    return handleApiError(error)
  }
}
```

- Precios: siempre recalculados en servidor antes de crear preferencia de pago
- Stock: se descuenta SOLO en el webhook de MP, nunca antes
- Órdenes: siempre filtrar por `userId === session.user.id`
- Uploads: firmados desde servidor, nunca exponer `CLOUDINARY_API_SECRET`
- Errores: nunca exponer stack traces al cliente
- Errores no operacionales: siempre reportar a Sentry con `Sentry.captureException(error)`
- Logs: usar `console.log/error/warn` normalmente — Axiom los captura automáticamente via next-axiom

---

## Convenciones

```
PascalCase  → componentes, tipos, interfaces
camelCase   → funciones, variables, props
kebab-case  → archivos, carpetas, slugs
UPPER_SNAKE → constantes y env vars
```

- Server Components por defecto. Client Components solo con interactividad real.
- Sin `useEffect` para fetching — Server Components o SWR.

---

## UX — el usuario siempre sabe qué pasa

- Carga → Skeleton en Suspense boundaries (nunca spinner suelto)
- Acción → botón deshabilitado + estado visual
- Error de validación → inline por campo, en tiempo real
- Error de pago → mensaje según código de MP (ver `lib/errors/mp-error-messages.ts`)
- Upload → barra de progreso + preview inmediato

---

## Variables de entorno (validadas con Zod en `lib/env.ts`)

```env
DATABASE_URL=
DIRECT_URL=          # Supabase session pooler (puerto 5432) — usado solo por Drizzle Kit para migraciones
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
NEXT_PUBLIC_MP_PUBLIC_KEY=
ANDREANI_API_KEY=
ANDREANI_CLIENT_ID=
CORREO_ARG_USER=
CORREO_ARG_PASSWORD=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=

# Monitoreo
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
AXIOM_TOKEN=
AXIOM_DATASET=
```

### Nota sobre DATABASE_URL y DIRECT_URL

Supabase expone dos connection strings distintas para el mismo proyecto:

- **DATABASE_URL** → Transaction pooler, puerto **6543**, con `?pgbouncer=true`.
  Es la que usa la app en runtime (todas las queries de Drizzle en producción
  sobre Vercel serverless). Reutiliza un pool de conexiones, evita agotar el
  límite de conexiones de Supabase con funciones serverless concurrentes.

- **DIRECT_URL** → Session pooler / conexión directa, puerto **5432**.
  Se usa ÚNICAMENTE en `drizzle.config.ts` para correr migraciones
  (`drizzle-kit generate` / `drizzle-kit migrate`). Las migraciones no
  funcionan bien a través del transaction pooler.

Nunca usar DIRECT_URL en runtime de la app — agotaría las conexiones
disponibles en el plan Free de Supabase.

---

## Regla de oro

Antes de avanzar al siguiente prompt:
1. Compila sin errores de TypeScript
2. Sin `any` nuevo
3. Flujo principal funciona en local
4. Errores visibles al usuario, nunca pantalla en blanco

---

## Archivos de contexto por área

| Archivo | Cuándo cargarlo |
|---|---|
| `01-database.md` | Schemas, migraciones, queries |
| `02-security.md` | Auth, rate limiting, errores, middleware |
| `03-catalog.md` | Catálogo, admin de productos, Cloudinary |
| `04-cart-checkout.md` | Carrito, checkout, MercadoPago, webhook |
| `05-notifications.md` | Mails transaccionales |
| `06-admin.md` | Panel de órdenes |
| `07-account.md` | Cuenta del cliente |
| `08-launch.md` | Importación masiva, SEO, deploy |