import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import * as schema from './schemas'

/**
 * Cliente Drizzle sobre PostgreSQL (Supabase) para entornos serverless (Vercel).
 *
 * - `prepare: false` es necesario con el connection pooler de Supabase (pgbouncer
 *   en modo transaction no soporta prepared statements).
 * - Se cachea la conexión en `globalThis` para no agotar conexiones con el HMR
 *   de desarrollo.
 */
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>
}

const client =
  globalForDb.__pgClient ?? postgres(env.DATABASE_URL, { prepare: false })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__pgClient = client
}

export const db = drizzle(client, { schema })

export { schema }

/** Acepta tanto el cliente principal como una transacción de Drizzle. */
export type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]
