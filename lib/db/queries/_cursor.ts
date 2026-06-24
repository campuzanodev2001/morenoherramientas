import { and, eq, lt, or, type SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

/**
 * Paginación por cursor sobre (createdAt, id) en orden descendente.
 * El cursor opaco codifica el último (createdAt, id) visto.
 */
export type Cursor = { createdAt: string; id: string }

export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url')
}

export function decodeCursor(raw: string | undefined | null): Cursor | null {
  if (!raw) return null
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8')
    const sep = decoded.indexOf('|')
    if (sep === -1) return null
    const createdAt = decoded.slice(0, sep)
    const id = decoded.slice(sep + 1)
    if (!createdAt || !id) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

/** Condición WHERE para traer filas estrictamente posteriores al cursor. */
export function cursorCondition(
  createdAtCol: PgColumn,
  idCol: PgColumn,
  cursor: Cursor,
): SQL | undefined {
  const date = new Date(cursor.createdAt)
  return or(
    lt(createdAtCol, date),
    and(eq(createdAtCol, date), lt(idCol, cursor.id)),
  )
}
