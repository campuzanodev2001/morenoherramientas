import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/helpers'
import { getOrdersByUser } from '@/lib/db/queries/orders'
import { ORDER_STATUS_META } from '@/lib/orders/status'
import { formatPrice } from '@/lib/catalog/format'

export const dynamic = 'force-dynamic'

function dateLabel(d: Date): string {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getServerSession()
  if (!session?.user?.id) redirect('/login?callbackUrl=/cuenta/ordenes')

  const sp = await searchParams
  const cursor = typeof sp.cursor === 'string' ? sp.cursor : null
  const { orders, nextCursor } = await getOrdersByUser(session.user.id, cursor, 10)

  if (orders.length === 0) {
    return (
      <div className="bg-surface-container-lowest border-2 border-charcoal p-10 text-center flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30" style={{ fontVariationSettings: "'FILL' 1" }}>
          receipt_long
        </span>
        <p className="text-base font-black uppercase text-on-surface-variant">Todavía no tenés compras</p>
        <Link href="/" className="border-2 border-primary-container text-primary-container font-black uppercase tracking-widest py-2.5 px-6 text-xs hover:bg-primary-container hover:text-on-primary transition-colors">
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((o) => (
        <Link
          key={o.id}
          href={`/cuenta/ordenes/${o.id}`}
          className="bg-surface-container-lowest border-2 border-outline hover:border-primary-container transition-colors p-4 flex items-center justify-between gap-4"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-black text-on-surface">{o.orderNumber}</span>
            <span className="text-xs text-on-surface-variant">{dateLabel(o.createdAt)}</span>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className={`inline-block border px-2 py-0.5 text-xs font-black uppercase ${ORDER_STATUS_META[o.status].badgeClass}`}>
              {ORDER_STATUS_META[o.status].label}
            </span>
            <span className="font-black text-on-surface">{formatPrice(o.total)}</span>
          </div>
        </Link>
      ))}

      {nextCursor && (
        <Link
          href={`/cuenta/ordenes?cursor=${encodeURIComponent(nextCursor)}`}
          className="self-center border-2 border-outline px-6 py-2 text-sm font-black uppercase hover:border-primary-container transition-colors"
        >
          Cargar más
        </Link>
      )}
    </div>
  )
}
