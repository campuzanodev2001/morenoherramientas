'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'nuevas', label: 'Nuevas (confirmadas + en preparación)' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'processing', label: 'En preparación' },
  { value: 'shipped', label: 'Enviada' },
  { value: 'delivered', label: 'Entregada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'refunded', label: 'Reembolsada' },
]

export default function OrdersFilterBar({
  initialSearch,
  initialStatus,
  initialFrom,
  initialTo,
}: {
  initialSearch: string
  initialStatus: string
  initialFrom: string
  initialTo: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)

  function apply(next: { q?: string; estado?: string; desde?: string; hasta?: string }) {
    const params = new URLSearchParams()
    const q = next.q ?? search
    const estado = next.estado ?? initialStatus
    const desde = next.desde ?? initialFrom
    const hasta = next.hasta ?? initialTo
    if (q) params.set('q', q)
    if (estado) params.set('estado', estado)
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    router.push(`/admin/ordenes${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <div className="flex gap-2 flex-col md:flex-row md:flex-wrap">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          apply({ q: search })
        }}
        className="flex-1 min-w-[200px]"
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nº de orden o email…"
          className="w-full border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container"
        />
      </form>
      <select
        value={initialStatus}
        onChange={(e) => apply({ estado: e.target.value })}
        className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container md:w-48"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={initialFrom}
        onChange={(e) => apply({ desde: e.target.value })}
        className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container"
        aria-label="Desde"
      />
      <input
        type="date"
        value={initialTo}
        onChange={(e) => apply({ hasta: e.target.value })}
        className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container"
        aria-label="Hasta"
      />
    </div>
  )
}
