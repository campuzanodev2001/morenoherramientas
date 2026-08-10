import Link from 'next/link'
import { listOrdersAdmin, type AdminOrderFilters } from '@/lib/db/queries/admin-orders'
import { ORDER_STATUS_META } from '@/lib/orders/status'
import { formatPrice } from '@/lib/catalog/format'
import type { OrderStatus } from '@/lib/db/types'
import OrdersFilterBar from './OrdersFilterBar'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const VALID_STATUS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

/**
 * Filtros que agrupan varios estados. Los usa el dashboard para que cada
 * tarjeta caiga en el listado que muestra exactamente lo que contó.
 */
const STATUS_GROUPS: Record<string, OrderStatus[]> = {
  nuevas: ['confirmed', 'processing'],
}

function resolveStatus(raw: string): OrderStatus | OrderStatus[] | undefined {
  if (STATUS_GROUPS[raw]) return STATUS_GROUPS[raw]
  return VALID_STATUS.includes(raw as OrderStatus) ? (raw as OrderStatus) : undefined
}

function dateLabel(d: Date): string {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const search = typeof sp.q === 'string' ? sp.q : ''
  const estadoParam = typeof sp.estado === 'string' ? sp.estado : ''
  // Un estado desconocido se descarta: no se propaga a los links ni al filtro.
  const estadoRaw = resolveStatus(estadoParam) ? estadoParam : ''
  const status = resolveStatus(estadoRaw)
  const from = typeof sp.desde === 'string' ? sp.desde : ''
  const to = typeof sp.hasta === 'string' ? sp.hasta : ''
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1

  const filters: AdminOrderFilters = { search, status, dateFrom: from || undefined, dateTo: to || undefined, page }
  const data = await listOrdersAdmin(filters)

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (estadoRaw) params.set('estado', estadoRaw)
    if (from) params.set('desde', from)
    if (to) params.set('hasta', to)
    params.set('page', String(p))
    return `/admin/ordenes?${params}`
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Órdenes</h1>
        <p className="text-on-surface-variant text-sm font-medium">{data.total} órdenes</p>
      </div>

      <OrdersFilterBar
        initialSearch={search}
        initialStatus={estadoRaw}
        initialFrom={from}
        initialTo={to}
      />

      <div className="overflow-x-auto border-2 border-outline">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container text-left">
              <th className="px-4 py-3 font-black uppercase text-xs tracking-wide">Orden</th>
              <th className="px-4 py-3 font-black uppercase text-xs tracking-wide">Fecha</th>
              <th className="px-4 py-3 font-black uppercase text-xs tracking-wide">Cliente</th>
              <th className="px-4 py-3 font-black uppercase text-xs tracking-wide">Estado</th>
              <th className="px-4 py-3 font-black uppercase text-xs tracking-wide text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant font-medium">
                  No hay órdenes con estos filtros.
                </td>
              </tr>
            ) : (
              data.rows.map((o) => (
                <tr key={o.id} className="border-t border-outline hover:bg-surface-container/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/ordenes/${o.id}`} className="font-black text-primary-container hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{dateLabel(o.createdAt)}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{o.customerEmail ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block border px-2 py-0.5 text-xs font-black uppercase ${ORDER_STATUS_META[o.status].badgeClass}`}>
                      {ORDER_STATUS_META[o.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-black">{formatPrice(o.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {data.page > 1 && (
            <Link href={pageHref(data.page - 1)} className="border-2 border-outline px-4 py-2 text-sm font-black uppercase hover:border-primary-container">
              Anterior
            </Link>
          )}
          <span className="text-sm font-medium text-on-surface-variant">
            Página {data.page} de {data.totalPages}
          </span>
          {data.page < data.totalPages && (
            <Link href={pageHref(data.page + 1)} className="border-2 border-outline px-4 py-2 text-sm font-black uppercase hover:border-primary-container">
              Siguiente
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
