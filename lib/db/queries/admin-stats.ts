import { and, count, gte, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schemas'
import { getAdminProductStats } from './admin-products'

export type DashboardStats = {
  products: { total: number; active: number; inactive: number; outOfStock: number }
  newOrders: number // confirmed + processing
  toProcess: number // confirmed
  incomeToday: number // centavos
}

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [products, [newOrdersRow], [toProcessRow], [incomeRow]] = await Promise.all([
    getAdminProductStats(),
    db
      .select({ c: count() })
      .from(orders)
      .where(inArray(orders.status, ['confirmed', 'processing'])),
    db.select({ c: count() }).from(orders).where(inArray(orders.status, ['confirmed'])),
    db
      .select({ s: sql<number>`coalesce(sum(${orders.total}), 0)::int` })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered']),
          gte(orders.createdAt, startOfDay),
        ),
      ),
  ])

  return {
    products,
    newOrders: newOrdersRow?.c ?? 0,
    toProcess: toProcessRow?.c ?? 0,
    incomeToday: incomeRow?.s ?? 0,
  }
}
