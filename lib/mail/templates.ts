import { env } from '@/lib/env'
import { formatPrice } from '@/lib/catalog/format'
import { getMpErrorMessage } from '@/lib/errors/mp-error-messages'

/**
 * Templates de mail en HTML inline (responsive, compatibles con clientes de
 * correo). Se generan como strings; cada uno expone un asunto y el HTML.
 */

const BRAND = 'Moreno Herramientas'
const RED = '#d92121'
const INK = '#1a1a1a'

function appUrl(path = ''): string {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type BaseOpts = {
  heading: string
  bodyHtml: string
  ctaText: string
  ctaUrl: string
}

function baseEmail({ heading, bodyHtml, ctaText, ctaUrl }: BaseOpts): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:2px solid ${INK}">
        <tr><td style="background:${INK};padding:20px 24px">
          <a href="${appUrl()}" style="color:#ffffff;font-weight:900;font-size:20px;text-decoration:none;text-transform:uppercase;letter-spacing:-0.5px">${BRAND}</a>
        </td></tr>
        <tr><td style="padding:28px 24px">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;text-transform:uppercase;color:${INK}">${heading}</h1>
          ${bodyHtml}
          <div style="margin:28px 0 8px">
            <a href="${ctaUrl}" style="display:inline-block;background:${RED};color:#ffffff;font-weight:900;text-transform:uppercase;letter-spacing:1px;text-decoration:none;padding:14px 28px;font-size:13px">${ctaText}</a>
          </div>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e0e0e0;color:#777;font-size:12px">
          ${BRAND} — Todo para tu taller. Este es un mail automático, no respondas a esta dirección.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function itemsTable(items: { productName: string; quantity: number; subtotal: number }[]): string {
  const rows = items
    .map(
      (it) =>
        `<tr><td style="padding:6px 0;font-size:14px">${escapeHtml(it.productName)} <strong>×${it.quantity}</strong></td><td align="right" style="padding:6px 0;font-size:14px;font-weight:700">${formatPrice(it.subtotal)}</td></tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e0e0e0;border-bottom:1px solid #e0e0e0;margin:12px 0">${rows}</table>`
}

type Address = {
  street: string
  number: string
  floor?: string | undefined
  city: string
  province: string
  postalCode: string
}

function addressLine(a: Address): string {
  const floor = a.floor ? `, ${escapeHtml(a.floor)}` : ''
  return `${escapeHtml(a.street)} ${escapeHtml(a.number)}${floor} — ${escapeHtml(a.city)}, ${escapeHtml(a.province)} (CP ${escapeHtml(a.postalCode)})`
}

export type Email = { subject: string; html: string }

export type OrderConfirmationProps = {
  orderId: string
  orderNumber: string
  items: { productName: string; quantity: number; subtotal: number }[]
  total: number
  shippingCost: number
  subtotal: number
  address: Address
  carrier: string | null
}

export function orderConfirmationEmail(p: OrderConfirmationProps): Email {
  const body = `
    <p style="font-size:15px;margin:0 0 8px">Recibimos tu pago y ya estamos preparando tu pedido <strong>${escapeHtml(p.orderNumber)}</strong>.</p>
    ${itemsTable(p.items)}
    <p style="font-size:14px;margin:4px 0">Subtotal: <strong>${formatPrice(p.subtotal)}</strong></p>
    <p style="font-size:14px;margin:4px 0">Envío${p.carrier ? ` (${escapeHtml(p.carrier)})` : ''}: <strong>${formatPrice(p.shippingCost)}</strong></p>
    <p style="font-size:16px;margin:8px 0 0">Total: <strong style="color:${RED}">${formatPrice(p.total)}</strong></p>
    <p style="font-size:13px;color:#555;margin:16px 0 0">Envío a: ${addressLine(p.address)}</p>`
  return {
    subject: `Confirmamos tu pedido ${p.orderNumber}`,
    html: baseEmail({
      heading: '¡Gracias por tu compra!',
      bodyHtml: body,
      ctaText: 'Ver mi orden',
      ctaUrl: appUrl(`/orden/${p.orderId}`),
    }),
  }
}

export type OrderShippedProps = {
  orderId: string
  orderNumber: string
  trackingNumber: string
  carrier: string | null
}

export function orderShippedEmail(p: OrderShippedProps): Email {
  const body = `
    <p style="font-size:15px;margin:0 0 8px">Tu pedido <strong>${escapeHtml(p.orderNumber)}</strong> ya fue despachado.</p>
    <p style="font-size:14px;margin:4px 0">Carrier: <strong>${escapeHtml(p.carrier ?? 'Correo')}</strong></p>
    <p style="font-size:14px;margin:4px 0">Seguimiento: <strong>${escapeHtml(p.trackingNumber)}</strong></p>`
  return {
    subject: `Tu pedido ${p.orderNumber} está en camino`,
    html: baseEmail({
      heading: 'Pedido enviado',
      bodyHtml: body,
      ctaText: 'Rastrear mi envío',
      ctaUrl: appUrl(`/orden/${p.orderId}`),
    }),
  }
}

export type OrderDeliveredProps = {
  orderNumber: string
}

export function orderDeliveredEmail(p: OrderDeliveredProps): Email {
  const body = `<p style="font-size:15px;margin:0 0 8px">Tu pedido <strong>${escapeHtml(p.orderNumber)}</strong> fue entregado. ¡Esperamos que lo disfrutes!</p>`
  return {
    subject: `Tu pedido ${p.orderNumber} fue entregado`,
    html: baseEmail({
      heading: 'Pedido entregado',
      bodyHtml: body,
      ctaText: 'Ver mis compras',
      ctaUrl: appUrl('/cuenta/ordenes'),
    }),
  }
}

export type PaymentFailedProps = {
  orderId: string
  orderNumber: string
  mpDetail: string | null
}

export function paymentFailedEmail(p: PaymentFailedProps): Email {
  const reason = getMpErrorMessage(p.mpDetail)
  const body = `
    <p style="font-size:15px;margin:0 0 8px">No pudimos procesar el pago de tu pedido <strong>${escapeHtml(p.orderNumber)}</strong>. No se realizó ningún cargo.</p>
    <p style="font-size:14px;margin:4px 0;color:#555">Motivo: ${escapeHtml(reason)}</p>
    <p style="font-size:14px;margin:8px 0">Podés volver a intentarlo cuando quieras.</p>`
  return {
    subject: `No pudimos procesar tu pago — pedido ${p.orderNumber}`,
    html: baseEmail({
      heading: 'El pago no se completó',
      bodyHtml: body,
      ctaText: 'Reintentar el pago',
      ctaUrl: appUrl('/checkout'),
    }),
  }
}

export type CancellationRequestProps = {
  orderNumber: string
  name: string
  email: string
  phone: string | null
  reason: string | null
  /** False cuando el número tipeado no matcheó ninguna orden de ese email. */
  orderFound: boolean
}

/** Acuse de recibo al comprador. La ley exige constancia del pedido. */
export function cancellationReceivedEmail(p: CancellationRequestProps): Email {
  const name = escapeHtml(p.name.split(' ')[0] ?? p.name)
  const body = `
    <p style="font-size:15px;margin:0 0 8px">Hola ${name}, recibimos tu pedido de arrepentimiento para la orden <strong>${escapeHtml(p.orderNumber)}</strong>.</p>
    <p style="font-size:14px;margin:8px 0">Este mail es tu constancia. Te vamos a contactar dentro de las próximas 48 horas hábiles para coordinar la devolución del producto y el reintegro del importe.</p>
    <p style="font-size:14px;margin:8px 0;color:#555">El costo de la devolución corre por nuestra cuenta, tal como establece el artículo 34 de la Ley 24.240.</p>`
  return {
    subject: `Recibimos tu pedido de arrepentimiento — orden ${p.orderNumber}`,
    html: baseEmail({
      heading: 'Pedido registrado',
      bodyHtml: body,
      ctaText: 'Ver mis pedidos',
      ctaUrl: appUrl('/cuenta/ordenes'),
    }),
  }
}

/** Aviso interno al admin. Tiene plazo legal, así que se manda aparte. */
export function cancellationAdminEmail(p: CancellationRequestProps): Email {
  const warn = p.orderFound
    ? ''
    : `<p style="font-size:14px;margin:8px 0;padding:10px;background:#fff4f4;border-left:4px solid ${RED}"><strong>Atención:</strong> el número de orden no coincide con ninguna orden de ese email. Verificar a mano antes de responder.</p>`
  const body = `
    <p style="font-size:15px;margin:0 0 8px">Nuevo pedido de arrepentimiento para la orden <strong>${escapeHtml(p.orderNumber)}</strong>.</p>
    ${warn}
    <p style="font-size:14px;margin:4px 0"><strong>Nombre:</strong> ${escapeHtml(p.name)}</p>
    <p style="font-size:14px;margin:4px 0"><strong>Email:</strong> ${escapeHtml(p.email)}</p>
    ${p.phone ? `<p style="font-size:14px;margin:4px 0"><strong>Teléfono:</strong> ${escapeHtml(p.phone)}</p>` : ''}
    <p style="font-size:14px;margin:4px 0"><strong>Motivo:</strong> ${p.reason ? escapeHtml(p.reason) : 'no indicó (no está obligado)'}</p>
    <p style="font-size:13px;margin:12px 0;color:#777">Hay 48 horas hábiles para responder.</p>`
  return {
    subject: `[Arrepentimiento] Orden ${p.orderNumber}`,
    html: baseEmail({
      heading: 'Pedido de arrepentimiento',
      bodyHtml: body,
      ctaText: 'Gestionar el pedido',
      ctaUrl: appUrl('/admin/arrepentimientos'),
    }),
  }
}

export type WelcomeEmailProps = {
  name: string | null
}

export function welcomeEmail(p: WelcomeEmailProps): Email {
  const name = p.name ? escapeHtml(p.name.split(' ')[0] ?? p.name) : ''
  const body = `<p style="font-size:15px;margin:0 0 8px">¡Hola${name ? ` ${name}` : ''}! Te damos la bienvenida a ${BRAND}. Encontrá todo para tu taller en un solo lugar.</p>`
  return {
    subject: `Bienvenido a ${BRAND}`,
    html: baseEmail({
      heading: '¡Bienvenido!',
      bodyHtml: body,
      ctaText: 'Explorar la tienda',
      ctaUrl: appUrl(),
    }),
  }
}
