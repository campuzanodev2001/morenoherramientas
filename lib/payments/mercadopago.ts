import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/lib/env'
import { PaymentError } from '@/lib/errors'
import { logWarn } from '@/lib/logger'

const MP_API = 'https://api.mercadopago.com'

/** Item de preferencia. `unitPrice` en PESOS (decimal), no en centavos. */
export type PreferenceItem = {
  title: string
  quantity: number
  unitPrice: number
}

export type CreatePreferenceInput = {
  orderId: string
  items: PreferenceItem[]
  payerEmail: string
}

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

/**
 * Crea una preferencia de Checkout Bricks. Los precios ya vienen recalculados
 * desde la DB por el servidor (nunca del cliente).
 */
export async function createPreference(input: CreatePreferenceInput): Promise<{ id: string }> {
  const appUrl = env.NEXT_PUBLIC_APP_URL
  const backUrl = `${appUrl}/orden/${input.orderId}`

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      items: input.items.map((it) => ({
        title: it.title,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        currency_id: 'ARS',
      })),
      payer: { email: input.payerEmail },
      back_urls: { success: backUrl, failure: backUrl, pending: backUrl },
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      external_reference: input.orderId,
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      statement_descriptor: 'FERRETERIA',
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    logWarn('payments:mp', 'createPreference falló', { status: res.status })
    throw new PaymentError(
      'No pudimos iniciar el pago. Intentá de nuevo.',
      'MP_PREFERENCE_FAILED',
      detail.slice(0, 200),
    )
  }

  const data = (await res.json()) as { id?: string }
  if (!data.id) throw new PaymentError('Respuesta inválida de MercadoPago', 'MP_PREFERENCE_FAILED', '')
  return { id: data.id }
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
