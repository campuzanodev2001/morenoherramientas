import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrderForAdmin } from '@/lib/db/queries/admin-orders'
import { ORDER_STATUS_META } from '@/lib/orders/status'
import { formatPrice } from '@/lib/catalog/format'
import OrderActions from './OrderActions'

export const dynamic = 'force-dynamic'

function dateTime(d: Date): string {
  return new Date(d).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function OrderDetailAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderForAdmin(id)
  if (!order) notFound()

  const addr = order.shippingAddress
  const meta = ORDER_STATUS_META[order.status]

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/ordenes" className="text-on-surface-variant hover:text-primary-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">{order.orderNumber}</h1>
          <span className={`inline-block border px-2 py-0.5 text-xs font-black uppercase ${meta.badgeClass}`}>
            {meta.label}
          </span>
        </div>
      </div>

      <OrderActions
        orderId={order.id}
        status={order.status}
        mpApproved={order.mpStatus === 'approved'}
        isTransfer={order.paymentMethod === 'transfer'}
      />

      {/* Timeline de estados */}
      {(() => {
        const flow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const
        const idx = flow.indexOf(order.status as (typeof flow)[number])
        const ended = order.status === 'cancelled' || order.status === 'refunded'
        return (
          <ol className="flex flex-wrap items-center gap-2 border-2 border-outline p-4">
            {ended ? (
              <li className={`border px-2 py-0.5 text-xs font-black uppercase ${meta.badgeClass}`}>
                {meta.label}
              </li>
            ) : (
              flow.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-black uppercase ${
                      i <= idx ? 'text-primary-container' : 'text-on-surface-variant/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {i < idx ? 'check_circle' : i === idx ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    {ORDER_STATUS_META[s].label}
                  </span>
                  {i < flow.length - 1 && <span className="text-outline">→</span>}
                </li>
              ))
            )}
          </ol>
        )
      })()}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Items */}
        <section className="border-2 border-outline p-5 flex flex-col gap-3 md:col-span-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-on-surface-variant">Items</h2>
          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <span className="text-on-surface">
                  <span className="font-black">{item.quantity}×</span> {item.productName}
                  {item.productSku ? <span className="text-on-surface-variant"> · {item.productSku}</span> : ''}
                  <span className="text-on-surface-variant"> · {formatPrice(item.unitPrice)} c/u</span>
                </span>
                <span className="font-black">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-outline pt-3 flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="font-black">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Descuento por transferencia</span>
                <span className="font-black text-emerald-700">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Envío</span>
              <span className="font-black">{formatPrice(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Medio de pago</span>
              <span className="font-black uppercase text-xs">
                {order.paymentMethod === 'transfer' ? 'Transferencia' : 'MercadoPago'}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-black uppercase">Total</span>
              <span className="text-lg font-black text-accent-red">{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        {/* Comprador */}
        <section className="border-2 border-outline p-5 flex flex-col gap-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-on-surface-variant">Comprador</h2>
          <p className="text-sm text-on-surface">{order.customerEmail ?? '—'}</p>
          {order.guestName && <p className="text-sm text-on-surface">{order.guestName}</p>}
          <p className="text-xs text-on-surface-variant">
            {order.userId ? 'Usuario registrado' : 'Compra como invitado'}
          </p>
        </section>

        {/* Envío */}
        <section className="border-2 border-outline p-5 flex flex-col gap-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-on-surface-variant">Envío</h2>
          <p className="text-sm text-on-surface">
            {addr.street} {addr.number}
            {addr.floor ? `, ${addr.floor}` : ''}
          </p>
          <p className="text-sm text-on-surface">
            {addr.city}, {addr.province} (CP {addr.postalCode})
          </p>
          {order.shippingCarrier && (
            <p className="text-xs text-on-surface-variant">
              {order.shippingMethod ?? order.shippingCarrier}
              {order.trackingNumber ? ` · ${order.trackingNumber}` : ''}
            </p>
          )}
        </section>

        {/* Historial de eventos de pago */}
        <section className="border-2 border-outline p-5 flex flex-col gap-3 md:col-span-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-on-surface-variant">
            Eventos de pago
          </h2>
          {order.paymentEvents.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Sin eventos registrados.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {order.paymentEvents.map((ev) => (
                <li key={ev.id} className="flex items-start gap-3 text-sm">
                  <span className="text-on-surface-variant whitespace-nowrap">{dateTime(ev.receivedAt)}</span>
                  <span className="font-bold text-on-surface">{ev.event ?? 'evento'}</span>
                  {ev.mpPaymentId && (
                    <span className="text-on-surface-variant">#{ev.mpPaymentId}</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
