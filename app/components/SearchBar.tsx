'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch() {
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-2 max-w-2xl mx-auto w-full">
      <div className="relative flex-1">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
          search
        </span>
        <input
          className="w-full pl-10 pr-4 py-4 bg-surface-container-lowest text-on-surface border-2 border-primary-container rounded-search focus:outline-none focus:border-accent-red text-base"
          placeholder="Buscá herramientas, repuestos..."
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
        />
      </div>
      <button
        onClick={handleSearch}
        className="bg-accent-red text-on-primary py-4 px-6 flex items-center justify-center gap-2 uppercase tracking-widest font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] rounded-none whitespace-nowrap"
      >
        Buscar productos
        <span className="material-symbols-outlined text-xl">arrow_forward</span>
      </button>
    </div>
  )
}
