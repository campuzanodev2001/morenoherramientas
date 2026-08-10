import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/lib/env'
import { PaymentError } from '@/lib/errors'
import { logWarn } from '@/lib/logger'

const MP_API = 'https://api.mercadopago.com'

export type MpPayment = {
  id: number
  status: string // approved | rejected | pending | in_process | ...
  statusDetail: string
  externalReference: string | null
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

export type CreatePaymentInput = {
  orderId: string
  /** Monto en centavos: se convierte a pesos acá, una sola vez. */
  amountCents: number
  description: string
  token?: string | undefined
  paymentMethodId: string
  issuerId?: string | undefined
  installments: number
  payerEmail: string
  payerIdentification?: { type: string; number: string } | undefined
}

/**
 * Crea el pago del Payment Brick (POST /v1/payments) con el token de tarjeta.
 *
 * El monto sale de la orden en la DB, nunca del cliente. La clave de
 * idempotencia es el id de la orden: si el comprador hace doble click o la red
 * reintenta, MP devuelve el mismo pago en vez de cobrar dos veces.
 */
export async function createPayment(input: CreatePaymentInput): Promise<MpPayment> {
  const res = await fetch(`${MP_API}/v1/payments`, {
    method: 'POST',
    headers: { ...authHeaders(), 'X-Idempotency-Key': input.orderId },
    body: JSON.stringify({
      transaction_amount: input.amountCents / 100,
      description: input.description,
      ...(input.token ? { token: input.token } : {}),
      payment_method_id: input.paymentMethodId,
      ...(input.issuerId ? { issuer_id: input.issuerId } : {}),
      installments: input.installments,
      external_reference: input.orderId,
      notification_url: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'FERRETERIA',
      payer: {
        email: input.payerEmail,
        ...(input.payerIdentification ? { identification: input.payerIdentification } : {}),
      },
    }),
    signal: AbortSignal.timeout(15_000),
  })

  const data = (await res.json().catch(() => null)) as {
    id?: number
    status?: string
    status_detail?: string
    external_reference?: string | null
    message?: string
  } | null

  if (!res.ok || !data?.id || !data.status) {
    // El mensaje de MP va al log del servidor (nunca al cliente): sin él,
    // diagnosticar un rechazo obliga a reproducir la llamada a mano.
    console.error('[payments:mp] createPayment falló', {
      httpStatus: res.status,
      mpMessage: data?.message,
      mpCause: JSON.stringify((data as { cause?: unknown } | null)?.cause ?? null).slice(0, 300),
    })
    logWarn('payments:mp', 'createPayment falló', { status: res.status })
    throw new PaymentError(
      'No pudimos procesar el pago. Intentá de nuevo.',
      'MP_PAYMENT_FAILED',
      (data?.message ?? '').slice(0, 200),
    )
  }

  return {
    id: data.id,
    status: data.status,
    statusDetail: data.status_detail ?? '',
    externalReference: data.external_reference ?? null,
  }
}

export type CreatePreferenceInput = {
  orderId: string
  orderNumber: string
  /** Ítems de la orden, con precios ya recalculados en el servidor. */
  items: { title: string; quantity: number; unitPriceCents: number }[]
  /** Costo de envío en centavos: viaja como un ítem más de la preferencia. */
  shippingCents: number
  payerEmail: string
  payerName?: string | undefined
}

/**
 * Crea la preferencia (POST /checkout/preferences) que habilita en el Payment
 * Brick los medios "Dinero en cuenta de Mercado Pago" y "Cuotas sin tarjeta".
 *
 * Esos dos medios NO se cobran desde nuestro backend: el Brick redirige al
 * comprador al sitio de MP usando este `preferenceId`, y el resultado nos llega
 * por el webhook. Por eso `external_reference` es el id de la orden — es la
 * única forma que tiene el webhook de saber qué orden confirmar.
 *
 * `purpose` se omite a propósito: fijarlo en `wallet_purchase` limitaría la
 * preferencia a dinero en cuenta, y en `onboarding_credits` a cuotas sin
 * tarjeta. Sin `purpose` la preferencia acepta los dos.
 */
export async function createPreference(input: CreatePreferenceInput): Promise<string> {
  const items = input.items.map((item) => ({
    title: item.title.slice(0, 250),
    quantity: item.quantity,
    unit_price: item.unitPriceCents / 100,
    currency_id: 'ARS',
  }))
  if (input.shippingCents > 0) {
    items.push({
      title: 'Envío',
      quantity: 1,
      unit_price: input.shippingCents / 100,
      currency_id: 'ARS',
    })
  }

  const backUrl = `${env.NEXT_PUBLIC_APP_URL}/orden/${input.orderId}`
  // MP rechaza `auto_return` si las back_urls apuntan a localhost. En local se
  // omite para que la preferencia igual se cree y el Brick pueda montarse; el
  // comprador vuelve a mano desde MP.
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(env.NEXT_PUBLIC_APP_URL)

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: { ...authHeaders(), 'X-Idempotency-Key': `pref-${input.orderId}` },
    body: JSON.stringify({
      items,
      external_reference: input.orderId,
      notification_url: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'FERRETERIA',
      payer: {
        email: input.payerEmail,
        ...(input.payerName ? { name: input.payerName } : {}),
      },
      back_urls: { success: backUrl, pending: backUrl, failure: backUrl },
      ...(isLocal ? {} : { auto_return: 'approved' }),
      metadata: { order_number: input.orderNumber },
    }),
    signal: AbortSignal.timeout(15_000),
  })

  const data = (await res.json().catch(() => null)) as { id?: string; message?: string } | null

  if (!res.ok || !data?.id) {
    console.error('[payments:mp] createPreference falló', {
      httpStatus: res.status,
      mpMessage: data?.message,
    })
    logWarn('payments:mp', 'createPreference falló', { status: res.status })
    throw new PaymentError(
      'No pudimos habilitar el pago con Mercado Pago. Intentá de nuevo.',
      'MP_PREFERENCE_FAILED',
      (data?.message ?? '').slice(0, 200),
    )
  }

  return data.id
}

/** Consulta el estado real de un pago en MP (no confiar en el webhook). */
export async function getPayment(paymentId: string): Promise<MpPayment> {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    throw new PaymentError('No pudimos verificar el pago', 'MP_PAYMENT_FETCH_FAILED', '')
  }
  const data = (await res.json()) as {
    id: number
    status: string
    status_detail?: string
    external_reference?: string | null
  }
  return {
    id: data.id,
    status: data.status,
    statusDetail: data.status_detail ?? '',
    externalReference: data.external_reference ?? null,
  }
}

/**
 * Valida la firma `x-signature` del webhook (HMAC-SHA256 sobre el manifest
 * `id:{dataId};request-id:{xRequestId};ts:{ts};`).
 */
export function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null,
): boolean {
  if (!xSignature || !dataId) return false

  const parts = Object.fromEntries(
    xSignature.split(',').map((kv) => {
      const [k, v] = kv.split('=')
      return [k?.trim() ?? '', v?.trim() ?? '']
    }),
  )
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId ?? ''};ts:${ts};`
  const expected = createHmac('sha256', env.MP_WEBHOOK_SECRET).update(manifest).digest('hex')

  try {
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(v1, 'hex')
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}
