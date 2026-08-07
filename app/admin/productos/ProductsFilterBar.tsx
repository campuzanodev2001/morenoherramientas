'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Option = { id: string; label: string }

export default function ProductsFilterBar({
  initialSearch,
  initialCategory,
  initialEstado,
  categories,
  sortParams,
}: {
  initialSearch: string
  initialCategory: string
  initialEstado: string
  categories: Option[]
  /** Orden actual, para no perderlo al cambiar un filtro. Vacío si es el default. */
  sortParams: { sort: string; dir: string } | null
}) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)

  function apply(next: { q?: string; cat?: string; estado?: string }) {
    const params = new URLSearchParams()
    const q = next.q ?? search
    const cat = next.cat ?? initialCategory
    const estado = next.estado ?? initialEstado
    if (q) params.set('q', q)
    if (cat) params.set('cat', cat)
    if (estado) params.set('estado', estado)
    if (sortParams) {
      params.set('sort', sortParams.sort)
      params.set('dir', sortParams.dir)
    }
    router.push(`/admin/productos${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <div className="flex gap-2 flex-col md:flex-row">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          apply({ q: search })
        }}
        className="flex-1"
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, marca o SKU…"
          className="w-full border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container"
        />
      </form>
      <select
        value={initialCategory}
        onChange={(e) => apply({ cat: e.target.value })}
        className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container md:w-56"
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <select
        value={initialEstado}
        onChange={(e) => apply({ estado: e.target.value })}
        className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container md:w-40"
      >
        <option value="">Todos</option>
        <option value="activos">Activos</option>
        <option value="inactivos">Inactivos</option>
      </select>
    </div>
  )
}
