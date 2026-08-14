import { z } from 'zod'

/**
 * Validación de variables de entorno con Zod.
 *
 * - `env`       → variables del SERVIDOR. Solo importar desde código de servidor
 *                 (Server Components, Route Handlers, Server Actions, scripts).
 *                 Nunca importar `env` desde un Client Component: filtraría
 *                 secretos al bundle del cliente.
 * - `clientEnv` → variables públicas (`NEXT_PUBLIC_*`). Seguras en el cliente.
 *
 * Si una variable falta o tiene formato inválido, la validación lanza al
 * arrancar con un mensaje claro indicando cuáles. La app no arranca con
 * configuración inválida.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Base de datos
  DATABASE_URL: z.url(),

  // Auth
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.url(),
  // Google OAuth es opcional: si falta cualquiera de las dos, el provider de
  // Google no se registra y el login queda con credentials + invitado.
  // Ver `googleAuthEnabled` en lib/auth/index.ts.
  // `.catch(undefined)` trata el string vacío como "no configurada": en Vercel
  // una variable puede existir con valor vacío, y sin esto el build rompería
  // igual que si faltara.
  GOOGLE_CLIENT_ID: z.string().min(1).optional().catch(undefined),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional().catch(undefined),

  // MercadoPago
  MP_ACCESS_TOKEN: z.string().min(1),
  MP_WEBHOOK_SECRET: z.string().min(1),

  // Pago por transferencia. Si falta cualquiera de las cuatro, el método no se
  // ofrece en el checkout (ver `getTransferAccount` en lib/payments/transfer.ts).
  // No son secretos —el comprador los necesita para transferir— pero viven en
  // env para no versionar datos bancarios ni tener que deployar al cambiarlos.
  TRANSFER_BANK_NAME: z.string().min(1).optional().catch(undefined),
  TRANSFER_ACCOUNT_HOLDER: z.string().min(1).optional().catch(undefined),
  TRANSFER_CBU: z.string().min(1).optional().catch(undefined),
  TRANSFER_ALIAS: z.string().min(1).optional().catch(undefined),
  TRANSFER_CUIT: z.string().min(1).optional().catch(undefined),

  // Envíos
  ANDREANI_API_KEY: z.string().min(1),
  ANDREANI_CLIENT_ID: z.string().min(1),
  CORREO_ARG_USER: z.string().min(1),
  CORREO_ARG_PASSWORD: z.string().min(1),

  // Mails
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.email(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // MercadoLibre — solo las usan los scripts de catálogo (scripts/ml-*.ts) para
  // leer la API de fichas de producto. La app en runtime no las necesita, así
  // que son opcionales: sin ellas el sitio arranca igual y solo fallan los
  // scripts, con un mensaje explícito.
  ML_CLIENT_ID: z.string().min(1).optional().catch(undefined),
  ML_CLIENT_SECRET: z.string().min(1).optional().catch(undefined),

  // Rate limiting
  UPSTASH_REDIS_URL: z.url(),
  UPSTASH_REDIS_TOKEN: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.url(),
  CRON_SECRET: z.string().min(32, 'CRON_SECRET debe tener al menos 32 caracteres'),

  // Monitoreo
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),
})

const clientSchema = z.object({
  NEXT_PUBLIC_MP_PUBLIC_KEY: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
})

/**
 * Las variables `NEXT_PUBLIC_*` deben referenciarse estáticamente para que
 * Next.js las inline en el bundle del cliente.
 */
const rawClientEnv = {
  NEXT_PUBLIC_MP_PUBLIC_KEY: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
}

function formatAndThrow(error: z.ZodError, scope: string): never {
  const missing = error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  throw new Error(
    `Variables de entorno inválidas (${scope}):\n${missing}\n` +
      `Revisá tu archivo .env (ver .env.example).`,
  )
}

function parseClientEnv() {
  const parsed = clientSchema.safeParse(rawClientEnv)
  if (!parsed.success) formatAndThrow(parsed.error, 'cliente')
  return parsed.data
}

function parseServerEnv() {
  // En el cliente no validamos el schema de servidor (esas vars no existen ahí).
  if (typeof window !== 'undefined') {
    throw new Error('lib/env: `env` (servidor) no debe importarse desde el cliente')
  }
  const parsed = serverSchema.safeParse(process.env)
  if (!parsed.success) formatAndThrow(parsed.error, 'servidor')
  return parsed.data
}

export const clientEnv = parseClientEnv()

// Lazy: solo se valida la primera vez que el servidor lo usa.
let cachedServerEnv: z.infer<typeof serverSchema> | null = null
export const env: z.infer<typeof serverSchema> = new Proxy({} as z.infer<typeof serverSchema>, {
  get(_target, prop: string) {
    cachedServerEnv ??= parseServerEnv()
    return cachedServerEnv[prop as keyof typeof cachedServerEnv]
  },
})
