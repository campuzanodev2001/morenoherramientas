import Link from 'next/link'
import type { SortDirection } from '@/lib/db/queries/admin-products'

/**
 * Header de tabla que ordena. Es un Link y no un botón: el orden vive en la
 * URL, así se puede compartir, recargar y volver atrás sin perderlo.
 */
export default function SortableHeader({
  label,
  href,
  direction,
  className = '',
}: {
  label: string
  href: string
  /** Dirección activa, o null si la tabla no está ordenada por esta columna. */
  direction: SortDirection | null
  className?: string
}) {
  return (
    <th
      scope="col"
      aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
      className={`text-left px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider ${className}`}
    >
      <Link
        href={href}
        className={`group inline-flex items-center gap-1 hover:text-accent-red transition-colors ${
          direction ? 'text-accent-red' : ''
        }`}
      >
        {label}
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-sm leading-none ${
            direction ? '' : 'opacity-0 group-hover:opacity-40 transition-opacity'
          }`}
        >
          {direction === 'asc' ? 'arrow_upward' : direction === 'desc' ? 'arrow_downward' : 'unfold_more'}
        </span>
      </Link>
    </th>
  )
}
