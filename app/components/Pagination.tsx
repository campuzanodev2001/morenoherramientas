import Link from 'next/link'

/** Ventana de páginas alrededor de la actual, con la primera y la última siempre visibles. */
function pageWindow(current: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const around = [current - 1, current, current + 1].filter((p) => p > 1 && p < totalPages)
  const pages: (number | 'gap')[] = [1]
  if ((around[0] ?? totalPages) > 2) pages.push('gap')
  pages.push(...around)
  if ((around[around.length - 1] ?? 1) < totalPages - 1) pages.push('gap')
  pages.push(totalPages)
  return pages
}

export default function Pagination({
  basePath,
  page,
  totalPages,
}: {
  /** URL sin el parámetro `page`, p. ej. `/categoria/llaves`. */
  basePath: string
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null

  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`)
  const arrow =
    'border-2 border-outline px-3 py-2 text-xs font-black uppercase text-on-surface hover:border-accent-red hover:text-accent-red transition-colors'
  const disabled = 'border-2 border-outline-variant px-3 py-2 text-xs font-black uppercase text-outline'

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1.5 flex-wrap pt-4">
      {page > 1 ? (
        <Link href={href(page - 1)} className={arrow} rel="prev">
          ←<span className="hidden sm:inline ml-1">Anterior</span>
        </Link>
      ) : (
        <span className={disabled} aria-disabled="true">
          ←<span className="hidden sm:inline ml-1">Anterior</span>
        </span>
      )}

      {pageWindow(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-outline text-xs font-black">
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            aria-current="page"
            className="border-2 border-accent-red bg-accent-red text-on-primary px-3 py-2 text-xs font-black tabular-nums"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className="border-2 border-outline px-3 py-2 text-xs font-black tabular-nums text-on-surface hover:border-accent-red hover:text-accent-red transition-colors"
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={arrow} rel="next">
          <span className="hidden sm:inline mr-1">Siguiente</span>→
        </Link>
      ) : (
        <span className={disabled} aria-disabled="true">
          <span className="hidden sm:inline mr-1">Siguiente</span>→
        </span>
      )}
    </nav>
  )
}
