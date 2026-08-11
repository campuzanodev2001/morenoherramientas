import Link from 'next/link'
import CancellationRow from './CancellationRow'
import { getCancellationRequests } from '@/lib/db/queries/cancellation-requests'
import type { CancellationStatus } from '@/lib/db/types'

export const dynamic = 'force-dynamic'

const VALID_STATUS: CancellationStatus[] = ['pending', 'in_review', 'resolved']

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'in_review', label: 'En gestión' },
  { value: 'resolved', label: 'Resueltos' },
]

function dateLabel(d: Date): string {
  return new Date(d).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

export default async function CancellationsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const estadoParam = typeof sp.estado === 'string' ? sp.estado : ''
  const status = VALID_STATUS.includes(estadoParam as CancellationStatus)
    ? (estadoParam as CancellationStatus)
    : undefined
  const page = Number(typeof sp.page === 'string' ? sp.page : '1') || 1

  const { rows, total, totalPages } = await getCancellationRequests({ status, page })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-black uppercase tracking-tight text-on-surface">
          Arrepentimientos
        </h1>
        <p className="text-sm text-on-surface-variant max-w-2xl">
          Pedidos de cancelación recibidos por el botón de arrepentimiento. Por ley hay{' '}
          <strong>48 horas hábiles</strong> para responder y el reintegro debe ser total, sin
          cargo para el comprador.
        </p>
        <p className="text-sm text-on-surface-variant max-w-2xl">
          Cambiar el estado acá <strong>no</strong> cancela la orden ni devuelve el dinero: el
          reintegro se hace a mano desde MercadoPago o por transferencia, y la orden se cancela
          desde su propia ficha.
        </p>
      </header>

      <nav className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = estadoParam === f.value
          return (
            <Link
              key={f.value || 'all'}
              href={f.value ? `/admin/arrepentimientos?estado=${f.value}` : '/admin/arrepentimientos'}
              className={`text-xs font-black uppercase tracking-wide px-4 py-2.5 border-2 border-charcoal transition-colors ${
                isActive
                  ? 'bg-accent-red text-on-primary'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="border-2 border-charcoal bg-surface-container-lowest p-10 text-center">
          <p className="text-sm font-bold text-on-surface">No hay pedidos de arrepentimiento</p>
          <p className="text-sm text-on-surface-variant mt-1">
            Los que lleguen desde <code className="font-mono text-xs">/arrepentimiento</code> van a
            aparecer acá.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            {total} {total === 1 ? 'pedido' : 'pedidos'}
          </p>
          <div className="flex flex-col gap-3">
            {rows.map((r) => (
              <CancellationRow
                key={r.id}
                id={r.id}
                orderId={r.orderId}
                orderNumber={r.orderNumber}
                name={r.name}
                email={r.email}
                phone={r.phone}
                reason={r.reason}
                status={r.status}
                adminNote={r.adminNote}
                createdAt={dateLabel(r.createdAt)}
                orderStatus={r.orderStatus}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex gap-2 justify-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/admin/arrepentimientos?${estadoParam ? `estado=${estadoParam}&` : ''}page=${p}`}
                  className={`text-xs font-black px-3 py-2 border-2 border-charcoal ${
                    p === page ? 'bg-accent-red text-on-primary' : 'bg-surface-container-lowest'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
