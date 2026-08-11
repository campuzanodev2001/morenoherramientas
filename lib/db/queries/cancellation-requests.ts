import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { cancellationRequests, orders, users } from '@/lib/db/schemas'
import type { CancellationRequest, CancellationStatus } from '@/lib/db/types'

/**
 * Busca la orden que corresponde a un pedido de arrepentimiento, exigiendo que
 * el número Y el email coincidan. Es una ruta pública: sin el doble match,
 * cualquiera podría enumerar números de orden y confirmar cuáles existen.
 *
 * Devuelve null cuando no hay match. El pedido igual se registra: el comprador
 * pudo tipear mal el número, y no podemos negarle el derecho por un typo.
 */
export async function findOrderForCancellation(
  orderNumber: string,
  email: string,
): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(
      and(
        eq(orders.orderNumber, orderNumber),
        or(
          sql`lower(${orders.guestEmail}) = lower(${email})`,
          sql`lower(${users.email}) = lower(${email})`,
        ),
      ),
    )
    .limit(1)
  return row ?? null
}

/**
 * True si ya hay un pedido abierto para ese mismo número de orden y email.
 * Evita que un doble click (o un usuario ansioso) genere varios pedidos y
 * varios mails al admin por lo mismo.
 */
export async function hasOpenCancellationRequest(
  orderNumber: string,
  email: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: cancellationRequests.id })
    .from(cancellationRequests)
    .where(
      and(
        eq(cancellationRequests.orderNumber, orderNumber),
        sql`lower(${cancellationRequests.email}) = lower(${email})`,
        sql`${cancellationRequests.status} <> 'resolved'`,
      ),
    )
    .limit(1)
  return row !== undefined
}

export type CreateCancellationData = {
  orderId: string | null
  orderNumber: string
  email: string
  name: string
  phone?: string | undefined
  reason?: string | undefined
}

export async function createCancellationRequest(
  data: CreateCancellationData,
): Promise<CancellationRequest> {
  const [row] = await db
    .insert(cancellationRequests)
    .values({
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      email: data.email,
      name: data.name,
      phone: data.phone ?? null,
      reason: data.reason ?? null,
    })
    .returning()

  if (!row) throw new Error('No se pudo registrar el pedido de arrepentimiento')
  return row
}

export type AdminCancellationRow = CancellationRequest & {
  /** Estado actual de la orden vinculada, si el número matcheó alguna. */
  orderStatus: string | null
}

export type AdminCancellationPage = {
  rows: AdminCancellationRow[]
  total: number
  page: number
  totalPages: number
}

export type AdminCancellationFilters = {
  status?: CancellationStatus | undefined
  search?: string | undefined
  page?: number | undefined
  limit?: number | undefined
}

export async function getCancellationRequests(
  filters: AdminCancellationFilters = {},
): Promise<AdminCancellationPage> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20))

  const conds = []
  if (filters.status) conds.push(eq(cancellationRequests.status, filters.status))
  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`
    const m = or(
      ilike(cancellationRequests.orderNumber, q),
      ilike(cancellationRequests.email, q),
      ilike(cancellationRequests.name, q),
    )
    if (m) conds.push(m)
  }
  const where = conds.length > 0 ? and(...conds) : undefined

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: cancellationRequests.id,
        orderId: cancellationRequests.orderId,
        orderNumber: cancellationRequests.orderNumber,
        email: cancellationRequests.email,
        name: cancellationRequests.name,
        phone: cancellationRequests.phone,
        reason: cancellationRequests.reason,
        status: cancellationRequests.status,
        adminNote: cancellationRequests.adminNote,
        createdAt: cancellationRequests.createdAt,
        updatedAt: cancellationRequests.updatedAt,
        orderStatus: orders.status,
      })
      .from(cancellationRequests)
      .leftJoin(orders, eq(cancellationRequests.orderId, orders.id))
      .where(where)
      .orderBy(desc(cancellationRequests.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(cancellationRequests).where(where),
  ])

  const total = totalRow?.value ?? 0
  return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) }
}

/** Cantidad de pedidos sin resolver — para el badge del panel admin. */
export async function countOpenCancellationRequests(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(cancellationRequests)
    .where(sql`${cancellationRequests.status} <> 'resolved'`)
  return row?.value ?? 0
}

export async function updateCancellationRequest(
  id: string,
  data: { status: CancellationStatus; adminNote?: string | undefined },
): Promise<void> {
  await db
    .update(cancellationRequests)
    .set({ status: data.status, adminNote: data.adminNote ?? null })
    .where(eq(cancellationRequests.id, id))
}
