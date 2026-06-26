import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { mailLogs } from '@/lib/db/schemas'

/** ¿Ya se envió un mail con esta idempotencyKey? */
export async function mailAlreadySent(idempotencyKey: string): Promise<boolean> {
  const [row] = await db
    .select({ id: mailLogs.id })
    .from(mailLogs)
    .where(eq(mailLogs.idempotencyKey, idempotencyKey))
    .limit(1)
  return Boolean(row)
}

/**
 * Registra un mail enviado. onConflictDoNothing sobre idempotencyKey: si dos
 * envíos compiten (webhook duplicado), solo uno gana la carrera.
 */
export async function recordMailSent(data: {
  idempotencyKey: string
  to: string
  template: string
}): Promise<boolean> {
  const inserted = await db
    .insert(mailLogs)
    .values(data)
    .onConflictDoNothing({ target: mailLogs.idempotencyKey })
    .returning({ id: mailLogs.id })
  return inserted.length > 0
}
