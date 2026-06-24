/**
 * Mapa de códigos de rechazo / estado de MercadoPago a mensajes en español
 * amigables para el usuario final.
 *
 * Se usa en la UI del checkout (PaymentBricks), en el mail PaymentFailed y en
 * el detalle de la orden. Cualquier código no contemplado cae en `default`.
 */

const MP_ERROR_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount: 'Fondos insuficientes en la tarjeta',
  cc_rejected_bad_filled_card_number: 'Número de tarjeta incorrecto',
  cc_rejected_bad_filled_date: 'Fecha de vencimiento incorrecta',
  cc_rejected_bad_filled_security_code: 'Código de seguridad incorrecto',
  cc_rejected_bad_filled_other: 'Revisá los datos de la tarjeta',
  cc_rejected_blacklist: 'No pudimos procesar el pago con esta tarjeta',
  cc_rejected_call_for_authorize: 'Llamá a tu banco para autorizar el pago',
  cc_rejected_card_disabled: 'Tu tarjeta está deshabilitada',
  cc_rejected_card_error: 'No pudimos procesar el pago con esta tarjeta',
  cc_rejected_duplicated_payment: 'Este pago ya fue procesado',
  cc_rejected_high_risk: 'El pago fue rechazado. Probá con otro medio de pago.',
  cc_rejected_max_attempts: 'Alcanzaste el máximo de intentos. Probá más tarde.',
  cc_rejected_other_reason: 'No pudimos procesar el pago. Intentá de nuevo.',
  pending_contingency: 'El pago está siendo procesado, te avisamos por mail',
  pending_review_manual: 'El pago está en revisión, te avisamos por mail',
  default: 'No pudimos procesar el pago. Intentá de nuevo.',
}

export function getMpErrorMessage(code: string | null | undefined): string {
  if (!code) return MP_ERROR_MESSAGES.default
  return MP_ERROR_MESSAGES[code] ?? MP_ERROR_MESSAGES.default
}

export { MP_ERROR_MESSAGES }
