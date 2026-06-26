import { and, desc, eq, lt, or, sql } from 'drizzle-orm'
import { db, type DbOrTx } from '@/lib/db'
import { orders, orderItems } from '@/lib/db/schemas'
import type {
  Order,
  OrderItem,
  OrderStatus,
  ShippingAddress,
} from '@/lib/db/types'
import { AppError } from '@/lib/errors'
import { encodeCursor, decodeCursor, cursorCondition } from './_cursor'

/** Transiciones de estado permitidas (06-admin.md). */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || VALID_TRANSITIONS[from].includes(to)
}

export type CreateOrderItem = {
  productId: string
  productName: string
  productSku: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export type CreateOrderData = {
  userId?: string | null
  guestEmail?: string | null
  guestName?: string | null
  subtotal: number
  shippingCost: number
  total: number
  shippingAddress: ShippingAddress
  shippingMethod?: string | null
  shippingCarrier?: string | null
  items: CreateOrderItem[]
}

async function nextOrderNumber(executor: DbOrTx): Promise<string> {
  const year = new Date().getFullYear()
  const [row] = await executor
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(sql`extract(year from ${orders.createdAt}) = ${year}`)
  const seq = String((row?.count ?? 0) + 1).padStart(4, '0')
  return `FE-${year}-${seq}`
}

/** Crea una orden en 'pending' con su número legible y sus items, en transacción. */
export async function createOrder(
  data: CreateOrderData,
): Promise<Order & { items: OrderItem[] }> {
  return db.transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx)
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        userId: data.userId ?? null,
        guestEmail: data.guestEmail ?? null,
        guestName: data.guestName ?? null,
        status: 'pending',
        subtotal: data.subtotal,
        shippingCost: data.shippingCost,
        total: data.total,
        shippingAddress: data.shippingAddress,
        shippingMethod: data.shippingMethod ?? null,
        shippingCarrier: data.shippingCarrier ?? null,
      })
      .returning()

    if (!order) throw new AppError('No se pudo crear la orden', 'ORDER_CREATE_FAILED', 500, false)

    const items = await tx
      .insert(orderItems)
      .values(data.items.map((it) => ({ ...it, orderId: order.id })))
      .returning()

    return { ...order, items }
  })
}

export type UpdateOrderExtra = Partial<
  Pick<
    Order,
    | 'trackingNumber'
    | 'shippingCarrier'
    | 'mpPaymentId'
    | 'mpPreferenceId'
    | 'mpStatus'
    | 'mpDetail'
  >
>

/**
 * Actualiza el estado de una orden validando la transición. Lanza AppError si
 * la transición no es válida. Acepta un executor para usarse dentro del webhook.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra: UpdateOrderExtra = {},
  executor: DbOrTx = db,
): Promise<Order> {
  const [current] = await executor
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!current) throw new AppError('Orden no encontrada', 'ORDER_NOT_FOUND', 404)
  if (!canTransition(current.status, status)) {
    throw new AppError(
      `Transición de estado inválida: ${current.status} → ${status}`,
      'INVALID_ORDER_TRANSITION',
      422,
    )
  }

  const [updated] = await executor
    .update(orders)
    .set({ status, ...extra })
    .where(eq(orders.id, orderId))
    .returning()

  if (!updated) throw new AppError('Orden no encontrada', 'ORDER_NOT_FOUND', 404)
  return updated
}

/** Asocia el preferenceId de MP a la orden recién creada (sin cambiar estado). */
export async function setOrderPreferenceId(orderId: string, preferenceId: string): Promise<void> {
  await db.update(orders).set({ mpPreferenceId: preferenceId }).where(eq(orders.id, orderId))
}

export type OrderWithItems = Order & { items: OrderItem[] }

/** Orden por id verificando ownership por userId. Null si no es del usuario. */
export async function getOrderById(
  orderId: string,
  userId: string,
): Promise<OrderWithItems | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)

  if (!order) return null

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))

  return { ...order, items }
}

/** Orden con items SIN chequear ownership. Solo para uso interno (webhook). */
export async function getOrderWithItemsById(orderId: string): Promise<OrderWithItems | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return null
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
  return { ...order, items }
}

/**
 * Orden visible para un viewer: el dueño (userId) o el invitado (guestEmail).
 * Devuelve null si no coincide, para no revelar si la orden existe.
 */
export async function getOrderForViewer(
  orderId: string,
  viewer: { userId?: string | null; email?: string | null },
): Promise<OrderWithItems | null> {
  const ownership = []
  if (viewer.userId) ownership.push(eq(orders.userId, viewer.userId))
  if (viewer.email) ownership.push(eq(orders.guestEmail, viewer.email.toLowerCase()))
  if (ownership.length === 0) return null

  const match = ownership.length === 1 ? ownership[0] : or(...ownership)
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), match))
    .limit(1)
  if (!order) return null

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
  return { ...order, items }
}

/**
 * Cancela las órdenes en 'pending' más viejas que `maxAgeMs`. Devuelve la
 * cantidad cancelada. Usado por el cron de limpieza.
 */
export async function cancelStalePendingOrders(maxAgeMs: number): Promise<number> {
  const threshold = new Date(Date.now() - maxAgeMs)
  const cancelled = await db
    .update(orders)
    .set({ status: 'cancelled', mpDetail: 'Cancelada automáticamente por falta de pago' })
    .where(and(eq(orders.status, 'pending'), lt(orders.createdAt, threshold)))
    .returning({ id: orders.id })
  return cancelled.length
}

export type OrderListPage = { orders: Order[]; nextCursor: string | null }

/** Historial de órdenes del usuario, paginado por cursor (filtrado por userId). */
export async function getOrdersByUser(
  userId: string,
  cursor?: string | null,
  limit = 10,
): Promise<OrderListPage> {
  const conds = [eq(orders.userId, userId)]
  const decoded = decodeCursor(cursor)
  if (decoded) {
    const c = cursorCondition(orders.createdAt, orders.id, decoded)
    if (c) conds.push(c)
  }

  const rows = await db
    .select()
    .from(orders)
    .where(and(...conds))
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const last = page.at(-1)
  const nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null

  return { orders: page, nextCursor }
}
