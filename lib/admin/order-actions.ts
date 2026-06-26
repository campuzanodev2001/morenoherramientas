'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schemas'
import { requireRole } from '@/lib/auth/helpers'
import { parseOrThrow } from '@/lib/errors/validation'
import { handleServerActionError, type ServerActionError } from '@/lib/errors/handlers'
import { AppError } from '@/lib/errors'
import { updateOrderStatus } from '@/lib/db/queries/orders'
import { onOrderShipped, onOrderDelivered } from '@/lib/mail/hooks'
import { logInfo } from '@/lib/logger'
import type { OrderStatus } from '@/lib/db/types'

type Ok = { success: true }
type ActionResult = Ok | ServerActionError

const shipSchema = z.object({
  trackingNumber: z.string().trim().min(1, 'Ingresá el número de seguimiento'),
  carrier: z.string().trim().min(1, 'Ingresá el carrier'),
})

/** Lee estado y mpStatus actuales de una orden. */
async function loadOrder(orderId: string): Promise<{ status: OrderStatus; mpStatus: string | null }> {
  const [row] = await db
    .select({ status: orders.status, mpStatus: orders.mpStatus })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (!row) throw new AppError('Orden no encontrada', 'ORDER_NOT_FOUND', 404)
  return row
}

function revalidate(orderId: string): void {
  revalidatePath('/admin/ordenes')
  revalidatePath(`/admin/ordenes/${orderId}`)
}

function logTransition(adminId: string, orderId: string, from: OrderStatus, to: OrderStatus): void {
  logInfo('admin:order', 'Transición de estado', { adminId, orderId, from, to })
}

export async function markAsProcessing(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireRole('admin')
    const { status } = await loadOrder(orderId)
    await updateOrderStatus(orderId, 'processing')
    logTransition(session.user.id, orderId, status, 'processing')
    revalidate(orderId)
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function markAsShipped(
  orderId: string,
  trackingNumber: string,
  carrier: string,
): Promise<ActionResult> {
  try {
    const session = await requireRole('admin')
    const { trackingNumber: tn, carrier: ca } = parseOrThrow(shipSchema, { trackingNumber, carrier })
    const { status } = await loadOrder(orderId)
    await updateOrderStatus(orderId, 'shipped', { trackingNumber: tn, shippingCarrier: ca })
    logTransition(session.user.id, orderId, status, 'shipped')
    revalidate(orderId)
    onOrderShipped(orderId, tn)
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function markAsDelivered(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireRole('admin')
    const { status } = await loadOrder(orderId)
    await updateOrderStatus(orderId, 'delivered')
    logTransition(session.user.id, orderId, status, 'delivered')
    revalidate(orderId)
    onOrderDelivered(orderId)
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireRole('admin')
    const { status, mpStatus } = await loadOrder(orderId)

    if (status !== 'pending' && status !== 'confirmed') {
      throw new AppError('Solo se pueden cancelar órdenes pendientes o confirmadas', 'INVALID_CANCEL', 422)
    }
    if (mpStatus === 'approved') {
      throw new AppError(
        'No se puede cancelar: el pago fue aprobado en MercadoPago (requiere reembolso)',
        'PAYMENT_APPROVED',
        422,
      )
    }

    await updateOrderStatus(orderId, 'cancelled', { mpDetail: 'Cancelada por el administrador' })
    logTransition(session.user.id, orderId, status, 'cancelled')
    revalidate(orderId)
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}
