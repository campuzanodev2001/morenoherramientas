# 02-security.md
# Cargar este archivo cuando trabajés en: auth, rate limiting, errores, middleware, APIs

---

## Cuándo usar este archivo

- Implementando autenticación de clientes (NextAuth)
- Configurando rate limiting
- Creando el sistema de manejo de errores
- Escribiendo cualquier API route
- Configurando middleware

---

## Sistema de errores

### Jerarquía en lib/errors/index.ts

```typescript
AppError (base)
  message: string
  code: string              // código interno, nunca expuesto al cliente
  statusCode: number
  isOperational: boolean    // true = error esperado, false = bug

ValidationError extends AppError
  errors: { field: string, message: string }[]

AuthError extends AppError           // 401
AuthorizationError extends AppError  // 403
NotFoundError extends AppError       // 404
RateLimitError extends AppError      // 429
  retryAfter: number
PaymentError extends AppError        // 402
  mpCode: string
  mpDetail: string
ShippingError extends AppError       // 503
```

### Handler centralizado en lib/errors/handlers.ts

```typescript
// Para API routes
handleApiError(error: unknown): NextResponse
// Respuesta siempre con esta forma:
// { error: { message: string, code: string, details?: unknown } }
// Si isOperational: usa statusCode y message del error
// Si no: loggea internamente, devuelve 500 genérico sin detalles

// Para Server Actions
handleServerActionError(error: unknown): { success: false, error: string }
```

> Nunca exponer stack traces, nombres de tablas, ni mensajes de la DB al cliente.

### Mensajes de error de MercadoPago en lib/errors/mp-error-messages.ts

Mapear códigos de MP a mensajes en español amigables:
```
cc_rejected_insufficient_amount   → "Fondos insuficientes en la tarjeta"
cc_rejected_bad_filled_card_number → "Número de tarjeta incorrecto"
cc_rejected_bad_filled_date       → "Fecha de vencimiento incorrecta"
cc_rejected_bad_filled_security_code → "Código de seguridad incorrecto"
cc_rejected_blacklist             → "No pudimos procesar el pago con esta tarjeta"
cc_rejected_call_for_authorize    → "Llamá a tu banco para autorizar el pago"
cc_rejected_card_disabled         → "Tu tarjeta está deshabilitada"
cc_rejected_duplicated_payment    → "Este pago ya fue procesado"
pending_contingency               → "El pago está siendo procesado, te avisamos por mail"
pending_review_manual             → "El pago está en revisión, te avisamos por mail"
default                           → "No pudimos procesar el pago. Intentá de nuevo."
```

---

## Rate limiting

### Límites predefinidos en lib/rate-limit/index.ts

```typescript
RATE_LIMITS = {
  LOGIN:      { limit: 5,   window: '15m' },
  CHECKOUT:   { limit: 10,  window: '1m'  },
  API_PUBLIC: { limit: 60,  window: '1m'  },
  WEBHOOK:    { limit: 100, window: '1m'  },
  SEARCH:     { limit: 30,  window: '1m'  },
}
```

- Algoritmo: sliding window (Upstash)
- Identificador: IP real del request (manejar X-Forwarded-For de Vercel)
- Si se supera: 429 con header `Retry-After` en segundos
- El middleware aplica `API_PUBLIC` a todas las rutas `/api/*` por defecto
- `/admin/*` no tiene rate limiting de la app (lo maneja Payload)

---

## Autenticación — dos sistemas separados

### Clientes de la tienda → NextAuth v5

```
Providers:
  - Google OAuth
  - Credentials (email + password con bcrypt 12 rounds)
  - Sesión anónima para compra sin registro (UUID en cookie)

JWT:
  - Access token: 15 minutos
  - Refresh token: 7 días, guardado en DB (tabla sessions)
  - Payload: { id, email, name, role }

Seguridad en Credentials provider:
  - Rate limiting LOGIN antes de cualquier query a la DB
  - Tiempo de respuesta constante (timing-safe):
    siempre ejecutar bcrypt.compare aunque el usuario no exista
    (usar hash dummy) para evitar timing attacks
  - Nunca revelar si el email existe o no en mensajes de error
```

### Admin del negocio → Payload CMS auth

```
- Solo accesible desde /admin
- Solo credentials (sin Google OAuth)
- Completamente separado de NextAuth
- Los tokens de Payload y NextAuth nunca se mezclan
```

### Helpers en lib/auth/helpers.ts

```typescript
getServerSession(): Promise<Session | null>
requireAuth(): Promise<Session>        // lanza AuthError si no hay sesión
requireRole(role: Role): Promise<Session>  // lanza AuthorizationError si el rol no coincide
isOwner(resourceUserId: string): Promise<void>  // lanza AuthorizationError si no coincide
```

---

## Middleware

```typescript
// middleware.ts — orden de ejecución
1. Extraer IP real (X-Forwarded-For → primera IP)
2. Aplicar rate limiting API_PUBLIC a /api/* (excepto /api/auth/*)
3. Proteger /cuenta/* → redirigir a /login si no hay sesión
4. Proteger /admin/* → manejar por Payload, no interferir
5. Agregar security headers a todas las respuestas
```

### Security headers obligatorios

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: política que permita Checkout Bricks de MP
```

---

## Prompts de esta área

### PROMPT 03 — Sistema de errores

```
Implementá el sistema de manejo de errores centralizado.

1. Creá lib/errors/index.ts con la jerarquía de errores definida en
   02-security.md. Cada error tiene: message, code, statusCode, isOperational.

2. Creá lib/errors/handlers.ts con:
   - handleApiError(error): NextResponse
     Mapea cualquier error a JSON { error: { message, code, details? } }
     Los errores no operacionales devuelven 500 genérico sin detalles internos.
   - handleServerActionError(error): { success: false, error: string }

3. Creá lib/errors/mp-error-messages.ts con el mapa completo de códigos
   de MercadoPago a mensajes en español amigables (ver 02-security.md).

4. Creá lib/errors/validation.ts con un helper que formatea errores de Zod
   en { field: string, message: string }[] para usar en formularios.

Los errores nunca filtran información interna. Siempre loggear el error
completo con console.error internamente antes de devolver la respuesta.
```

### PROMPT 04 — Rate limiting

```
Implementá rate limiting con Upstash Redis.

1. Creá lib/rate-limit/index.ts:
   - rateLimit({ identifier, limit, window }): sliding window con Upstash
   - Devuelve { success, limit, remaining, retryAfter? }
   - Constantes RATE_LIMITS con los límites definidos en 02-security.md

2. Creá withRateLimit(handler, limitKey): wrapper para API routes.
   Si supera el límite: 429 con header Retry-After y RateLimitError.

3. Creá getClientIp(request): extrae la IP real manejando X-Forwarded-For
   de Vercel correctamente (primera IP de la lista, no la última).

4. Actualizá middleware.ts con los security headers y rate limiting
   API_PUBLIC en todas las rutas /api/* excepto /api/auth/*.

Verificar: más de 60 requests por minuto a cualquier API route
devuelve 429 con Retry-After correcto.
```

### PROMPT 05 — Autenticación de clientes

```
Implementá autenticación de clientes con NextAuth v5.

1. Configurá lib/auth/index.ts:
   - DrizzleAdapter con PostgreSQL
   - Google OAuth provider
   - Credentials provider con las reglas de seguridad de 02-security.md:
     * Rate limiting LOGIN antes de cualquier query
     * Timing-safe: bcrypt.compare siempre, incluso con hash dummy
     * Sin revelar si el email existe
   - JWT con payload { id, email, name, role }
   - Access token 15min, refresh token 7 días en DB

2. Creá app/api/auth/[...nextauth]/route.ts

3. Creá lib/auth/helpers.ts con los cuatro helpers definidos en 02-security.md.

4. En el callback signIn: merge del carrito anónimo al loguearse.
   Si hay un cartId en la cookie de sesión anónima, migrar los items
   a la DB sumando cantidades duplicadas.

5. Creá app/(auth)/login/page.tsx y app/(auth)/registro/page.tsx.
   Formularios como Client Components con validación Zod inline.
   Errores por campo, nunca alertas. Loading state en el botón de submit.

6. Actualizá middleware.ts para proteger /cuenta/* con requireAuth.
   Si la sesión expira, redirigir a /login con callbackUrl.
```

---

## Observabilidad — Sentry + Axiom

### Cómo funciona Axiom en este proyecto
Axiom captura automáticamente todos los `console.log/warn/error` del servidor
via `next-axiom`. No necesitás Log Drains ni Vercel Pro.
Sentry sigue siendo el responsable de capturar y alertar sobre errores.
Los dos se complementan: Axiom para ver qué pasó, Sentry para que te avisen.

### Regla global
- Errores operacionales (ValidationError, AuthError, etc.) → solo loggear con console.error
- Errores no operacionales (bugs inesperados) → `Sentry.captureException(error)` + console.error
- Usar `console.log/warn/error` normalmente — Axiom los captura automáticamente
- Siempre incluir contexto estructurado en los logs (ver ejemplos abajo)

### Integración en handleApiError

```typescript
import * as Sentry from '@sentry/nextjs'

export function handleApiError(error: unknown): NextResponse {
  // Loggear siempre con contexto — Axiom lo captura automáticamente
  console.error('[api:error]', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    isOperational: error instanceof AppError ? error.isOperational : false,
  })

  // Reportar a Sentry solo si NO es un error operacional esperado
  if (!(error instanceof AppError) || !error.isOperational) {
    Sentry.captureException(error)
  }

  if (error instanceof AppError && error.isOperational) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.statusCode }
    )
  }

  return NextResponse.json(
    { error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  )
}
```

### Cómo loggear con contexto útil

```typescript
// Bueno — prefijo con área + contexto estructurado
console.error('[webhook:mp] Error al actualizar orden', {
  orderId,
  mpPaymentId,
  status,
  error: error instanceof Error ? error.message : 'Unknown',
})

console.info('[checkout] Preferencia creada', {
  orderId,
  preferenceId,
  total,
  userId: session?.user?.id ?? 'guest',
})

// Malo — sin contexto, imposible debuggear
console.error('Error al procesar pago')
```

### Convención de prefijos para los logs
```
[webhook:mp]    → webhook de MercadoPago
[checkout]      → flujo de checkout
[auth]          → autenticación
[cart]          → carrito
[shipping]      → cotización de envíos
[admin]         → panel admin
[cron]          → cron jobs
[db]            → queries a la base de datos
```

### Alertas recomendadas en Sentry
- Nuevo error nunca visto → email inmediato
- Mismo error 10+ veces en 1 hora → email inmediato
- Cualquier error en `/api/webhooks/mercadopago` → email inmediato

---

## PROMPT 03b — Sentry + Axiom

```
Configurá el sistema de observabilidad completo. Tiene que estar
listo antes del PROMPT 01 — todos los prompts siguientes asumen
que Sentry y Axiom están activos.

1. Instalá Sentry con el wizard oficial:
   npx @sentry/wizard@latest -i nextjs
   Configurá con: NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN,
   SENTRY_ORG, SENTRY_PROJECT.
   En sentry.server.config.ts y sentry.client.config.ts:
     tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0

2. Instalá y configurá Axiom:
   npm install next-axiom
   
   En next.config.ts:
   import { withAxiom } from 'next-axiom'
   export default withAxiom(nextConfig)
   
   Configurá con: AXIOM_TOKEN, AXIOM_DATASET.
   Axiom captura automáticamente todos los console.log/warn/error
   del servidor. No requiere ningún cambio adicional en el código.

3. Actualizá lib/errors/handlers.ts:
   - Agregar Sentry.captureException() para errores no operacionales
   - Usar console.error con contexto estructurado (ver 02-security.md)
   - El formato del log debe incluir el prefijo de área

4. Configurar alertas en Sentry:
   - Nuevo issue → notificación por email
   - Issue en /api/webhooks/mercadopago → notificación inmediata
   - Más de 10 ocurrencias del mismo issue en 1 hora → email

5. Verificar que funciona:
   - Tirar un error intencional en una API route
   - Confirmar que aparece en el dashboard de Sentry con stack trace
   - Confirmar que el console.error aparece en el dashboard de Axiom
   - En desarrollo: confirmar que solo van a la consola local
```
