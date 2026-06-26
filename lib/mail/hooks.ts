import { logError } from '@/lib/logger'
import {
  sendOrderConfirmation,
  sendOrderShipped,
  sendOrderDelivered,
  sendPaymentFailed,
  sendWelcomeEmail,
} from './dispatch'

/**
 * Puntos de enganche de mails en formato fire-and-forget: NUNCA se les hace
 * `await` desde el flujo principal (webhook, server actions, signIn). Un fallo
 * de mail no debe romper el flujo. Cada dispatch ya captura sus errores; este
 * `.catch` es una red de seguridad extra.
 */
function fireAndForget(promise: Promise<void>, scope: string): void {
  void promise.catch((error: unknown) => {
    logError('mail:hook', `${scope} falló`, {
      error: error instanceof Error ? error.message : 'unknown',
    })
  })
}

export function onPaymentApproved(orderId: string): void {
  fireAndForget(sendOrderConfirmation(orderId), 'onPaymentApproved')
}

export function onPaymentRejected(orderId: string): void {
  fireAndForget(sendPaymentFailed(orderId), 'onPaymentRejected')
}

export function onOrderShipped(orderId: string, trackingNumber: string): void {
  fireAndForget(sendOrderShipped(orderId, trackingNumber), 'onOrderShipped')
}

export function onOrderDelivered(orderId: string): void {
  fireAndForget(sendOrderDelivered(orderId), 'onOrderDelivered')
}

export function onUserWelcome(userId: string): void {
  fireAndForget(sendWelcomeEmail(userId), 'onUserWelcome')
}
