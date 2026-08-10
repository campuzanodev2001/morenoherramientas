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
