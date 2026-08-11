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
import {
  updateOrderStatus,
  confirmPendingOrder,
  getOrderWithItemsById,
} from '@/lib/db/queries/orders'
import { decrementStock } from '@/lib/db/queries/products'
import { clearCart } from '@/lib/db/queries/cart'
import { onOrderShipped, onOrderDelivered, onPaymentApproved } from '@/lib/mail/hooks'
import { logInfo } from '@/lib/logger'
import type { OrderStatus } from '@/lib/db/types'
import type { PaymentMethod } from '@/lib/validations/checkout'

type Ok = { success: true }
type ActionResult = Ok | ServerActionError

const shipSchema = z.object({
  trackingNumber: z.string().trim().min(1, 'Ingresá el número de seguimiento'),
  carrier: z.string().trim().min(1, 'Ingresá el carrier'),
})

/** Lee estado y mpStatus actuales de una orden. */
async function loadOrder(
  orderId: string,
): Promise<{ status: OrderStatus; mpStatus: string | null; paymentMethod: PaymentMethod }> {
  const [row] = await db
    .select({
      status: orders.status,
      mpStatus: orders.mpStatus,
      paymentMethod: orders.paymentMethod,
    })
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

/**
 * Confirma una orden pagada por transferencia, una vez que el admin verificó
 * el dinero en la cuenta.
 *
 * Es el equivalente del webhook de MercadoPago para este medio: es acá donde
 * se descuenta el stock, y por eso pasa por `confirmPendingOrder` —que solo
 * transiciona si la orden seguía en 'pending'— dentro de la misma transacción.
 * Dos admins clickeando a la vez no pueden descontar stock dos veces.
 */
export async function confirmTransferPayment(orderId: string): Promise<ActionResult> {
  try {
    const session = await requireRole('admin')
    const { status, paymentMethod } = await loadOrder(orderId)

    if (paymentMethod !== 'transfer') {
      throw new AppError(
        'Esta orden no se paga por transferencia: la confirma el webhook de MercadoPago',
        'NOT_A_TRANSFER_ORDER',
        422,
      )
    }
    if (status !== 'pending') {
      throw new AppError(
        'Solo se pueden confirmar órdenes pendientes',
        'ORDER_NOT_PENDING',
        422,
      )
    }

    const order = await getOrderWithItemsById(orderId)
    if (!order) throw new AppError('Orden no encontrada', 'ORDER_NOT_FOUND', 404)

    const confirmed = await db.transaction(async (tx) => {
      const updated = await confirmPendingOrder(
        orderId,
        { mpDetail: 'Transferencia verificada por el administrador' },
        tx,
      )
      if (!updated) return false
      for (const item of order.items) {
        if (item.productId) await decrementStock(item.productId, item.quantity, tx)
      }
      if (order.userId) await clearCart(order.userId)
      return true
    })

    if (!confirmed) {
      throw new AppError('La orden ya no estaba pendiente', 'ORDER_NOT_PENDING', 422)
    }

    logTransition(session.user.id, orderId, status, 'confirmed')
    revalidate(orderId)
    revalidatePath('/')
    onPaymentApproved(orderId)
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
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
