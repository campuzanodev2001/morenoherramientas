import { and, count, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders, orderItems, users } from '@/lib/db/schemas'
import type { Order, OrderItem, OrderStatus, PaymentEvent } from '@/lib/db/types'
import { getPaymentEventsByOrder } from './payment-events'

export type AdminOrderRow = {
  id: string
  orderNumber: string
  createdAt: Date
  customerEmail: string | null
  status: OrderStatus
  total: number
}

export type AdminOrderFilters = {
  status?: OrderStatus
  search?: string
  dateFrom?: string // ISO yyyy-mm-dd
  dateTo?: string
  page?: number
  limit?: number
}

export type AdminOrderPage = {
  rows: AdminOrderRow[]
  total: number
  page: number
  totalPages: number
}

function buildConds(filters: AdminOrderFilters) {
  const conds = []
  if (filters.status) conds.push(eq(orders.status, filters.status))
  if (filters.search && filters.search.trim()) {
    const q = `%${filters.search.trim()}%`
    const m = or(
      ilike(orders.orderNumber, q),
      ilike(orders.guestEmail, q),
      ilike(users.email, q),
    )
    if (m) conds.push(m)
  }
  if (filters.dateFrom) conds.push(gte(orders.createdAt, new Date(filters.dateFrom)))
  if (filters.dateTo) {
    // Incluir todo el día final.
    conds.push(lte(orders.createdAt, new Date(`${filters.dateTo}T23:59:59.999Z`)))
  }
  return conds
}

export async function listOrdersAdmin(filters: AdminOrderFilters = {}): Promise<AdminOrderPage> {
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100)
  const page = Math.max(filters.page ?? 1, 1)
  const offset = (page - 1) * limit
  const conds = buildConds(filters)

  const [{ total }] = await db
    .select({ total: count() })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(conds.length ? and(...conds) : undefined)

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      status: orders.status,
      total: orders.total,
      customerEmail: sql<string | null>`coalesce(${orders.guestEmail}, ${users.email})`,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(limit)
    .offset(offset)

  return {
    rows,
    total: total ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((total ?? 0) / limit)),
  }
}

export type AdminOrderDetail = Order & {
  items: OrderItem[]
  customerEmail: string | null
  paymentEvents: PaymentEvent[]
}

export async function getOrderForAdmin(orderId: string): Promise<AdminOrderDetail | null> {
  const [row] = await db
    .select({
      order: orders,
      customerEmail: sql<string | null>`coalesce(${orders.guestEmail}, ${users.email})`,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  if (!row) return null

  const [items, paymentEvents] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    getPaymentEventsByOrder(orderId),
  ])

  return { ...row.order, items, customerEmail: row.customerEmail, paymentEvents }
}
