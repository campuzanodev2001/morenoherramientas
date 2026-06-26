import { logInfo } from '@/lib/logger'

/**
 * Puntos de enganche de mails, en formato fire-and-forget: NUNCA se les hace
 * `await` desde el flujo principal (webhook, server actions). Un fallo de mail
 * no debe romper el flujo. MAIL-01 conecta estas funciones con los dispatch
 * reales de Resend; hasta entonces solo loggean.
 */

export function onPaymentApproved(orderId: string): void {
  logInfo('mail:hook', 'OrderConfirmation pendiente de envío (MAIL-01)', { orderId })
}

export function onPaymentRejected(orderId: string): void {
  logInfo('mail:hook', 'PaymentFailed pendiente de envío (MAIL-01)', { orderId })
}

export function onOrderShipped(orderId: string, trackingNumber: string): void {
  logInfo('mail:hook', 'OrderShipped pendiente de envío (MAIL-01)', { orderId, trackingNumber })
}

export function onOrderDelivered(orderId: string): void {
  logInfo('mail:hook', 'OrderDelivered pendiente de envío (MAIL-01)', { orderId })
}

export function onUserWelcome(userId: string): void {
  logInfo('mail:hook', 'WelcomeEmail pendiente de envío (MAIL-01)', { userId })
}
