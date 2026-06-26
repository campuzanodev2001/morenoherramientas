import { getOrderWithItemsById } from '@/lib/db/queries/orders'
import { getUserById } from '@/lib/db/queries/users'
import { logError } from '@/lib/logger'
import { sendMail } from './index'
import {
  orderConfirmationEmail,
  orderShippedEmail,
  orderDeliveredEmail,
  paymentFailedEmail,
  welcomeEmail,
} from './templates'
import type { OrderWithItems } from '@/lib/db/queries/orders'

/** Email del destinatario de una orden: invitado o usuario registrado. */
async function recipientEmail(order: OrderWithItems): Promise<string | null> {
  if (order.guestEmail) return order.guestEmail
  if (order.userId) {
    const user = await getUserById(order.userId)
    return user?.email ?? null
  }
  return null
}

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    const order = await getOrderWithItemsById(orderId)
    if (!order) return
    const to = await recipientEmail(order)
    if (!to) return

    const email = orderConfirmationEmail({
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      total: order.total,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      address: order.shippingAddress,
      carrier: order.shippingCarrier,
    })
    await sendMail({ ...email, to, template: 'OrderConfirmation', idempotencyKey: `${orderId}:OrderConfirmation` })
  } catch (error) {
    logError('mail:dispatch', 'sendOrderConfirmation falló', {
      orderId,
      error: error instanceof Error ? error.message : 'unknown',
    })
  }
}

export async function sendOrderShipped(orderId: string, trackingNumber: string): Promise<void> {
  try {
    const order = await getOrderWithItemsById(orderId)
    if (!order) return
    const to = await recipientEmail(order)
    if (!to) return

    const email = orderShippedEmail({
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingNumber,
      carrier: order.shippingCarrier,
    })
    await sendMail({ ...email, to, template: 'OrderShipped', idempotencyKey: `${orderId}:OrderShipped` })
  } catch (error) {
    logError('mail:dispatch', 'sendOrderShipped falló', {
      orderId,
      error: error instanceof Error ? error.message : 'unknown',
    })
  }
}

export async function sendOrderDelivered(orderId: string): Promise<void> {
  try {
    const order = await getOrderWithItemsById(orderId)
    if (!order) return
    const to = await recipientEmail(order)
    if (!to) return

    const email = orderDeliveredEmail({ orderNumber: order.orderNumber })
    await sendMail({ ...email, to, template: 'OrderDelivered', idempotencyKey: `${orderId}:OrderDelivered` })
  } catch (error) {
    logError('mail:dispatch', 'sendOrderDelivered falló', {
      orderId,
      error: error instanceof Error ? error.message : 'unknown',
    })
  }
}

export async function sendPaymentFailed(orderId: string): Promise<void> {
  try {
    const order = await getOrderWithItemsById(orderId)
    if (!order) return
    const to = await recipientEmail(order)
    if (!to) return

    const email = paymentFailedEmail({
      orderId: order.id,
      orderNumber: order.orderNumber,
      mpDetail: order.mpDetail,
    })
    await sendMail({ ...email, to, template: 'PaymentFailed', idempotencyKey: `${orderId}:PaymentFailed` })
  } catch (error) {
    logError('mail:dispatch', 'sendPaymentFailed falló', {
      orderId,
      error: error instanceof Error ? error.message : 'unknown',
    })
  }
}

export async function sendWelcomeEmail(userId: string): Promise<void> {
  try {
    const user = await getUserById(userId)
    if (!user?.email) return

    const email = welcomeEmail({ name: user.name })
    await sendMail({ ...email, to: user.email, template: 'WelcomeEmail', idempotencyKey: `${userId}:WelcomeEmail` })
  } catch (error) {
    logError('mail:dispatch', 'sendWelcomeEmail falló', {
      userId,
      error: error instanceof Error ? error.message : 'unknown',
    })
  }
}
