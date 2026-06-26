import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/helpers'
import { getOrderById } from '@/lib/db/queries/orders'
import { ORDER_STATUS_META } from '@/lib/orders/status'
import { formatPrice } from '@/lib/catalog/format'
import { getMpErrorMessage } from '@/lib/errors/mp-error-messages'

export const dynamic = 'force-dynamic'

function trackingUrl(carrier: string | null, tracking: string): string | null {
  if (!carrier) return null
  if (carrier.includes('andreani')) return `https://www.andreani.com/#!/informacionEnvio/${tracking}`
  if (carrier.includes('correo')) return `https://www.correoargentino.com.ar/formularios/ondnc?n=${tracking}`
  return null
}

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session?.user?.id) redirect('/login?callbackUrl=/cuenta/ordenes')

  const { id } = await params
  // getOrderById filtra por userId: si la orden no es del usuario devuelve null.
  const order = await getOrderById(id, session.user.id)
  if (!order) notFound()

  const addr = order.shippingAddress
  const meta = ORDER_STATUS_META[order.status]
  const track = order.trackingNumber ? trackingUrl(order.shippingCarrier, order.trackingNumber) : null

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/cuenta/ordenes" className="text-on-surface-variant hover:text-accent-red">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-xl font-black text-on-surface">{order.orderNumber}</h2>
        <span className={`inline-block border px-2 py-0.5 text-xs font-black uppercase ${meta.badgeClass}`}>
          {meta.label}
        </span>
      </div>

      {order.status === 'pending' && (
        <p className="text-sm font-medium text-on-surface-variant border-2 border-outline p-4">
          Tu pago está siendo procesado. Te avisamos por mail cuando se confirme.
        </p>
      )}
      {order.status === 'cancelled' && order.mpDetail && (
        <p className="text-sm font-bold text-accent-red border-2 border-accent-red/40 bg-accent-red/5 p-4">
          El pago no se completó: {getMpErrorMessage(order.mpDetail)}
        </p>
      )}

      <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-on-surface-variant">Productos</h3>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-start text-sm">
            <span className="text-on-surface">
              <span className="font-black">{item.quantity}×</span> {item.productName}
            </span>
            <span className="font-black">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
        <div className="border-t border-outline pt-3 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Subtotal</span>
            <span className="font-black">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Envío</span>
            <span className="font-black">{formatPrice(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="font-black uppercase">Total</span>
            <span className="text-lg font-black text-accent-red">{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-2">
        <h3 className="text-sm font-black uppercase tracking-wide text-on-surface-variant">Envío</h3>
        <p className="text-sm text-on-surface">
          {addr.street} {addr.number}
          {addr.floor ? `, ${addr.floor}` : ''}
        </p>
        <p className="text-sm text-on-surface">
          {addr.city}, {addr.province} (CP {addr.postalCode})
        </p>
        {order.trackingNumber && (
          <p className="text-sm text-on-surface-variant">
            Seguimiento: <span className="font-black text-on-surface">{order.trackingNumber}</span>
            {track && (
              <>
                {' · '}
                <a href={track} target="_blank" rel="noopener noreferrer" className="font-black text-primary-container hover:underline">
                  Rastrear envío
                </a>
              </>
            )}
          </p>
        )}
      </section>
    </div>
  )
}
