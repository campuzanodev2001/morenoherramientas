'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { updateSectionsAction } from '@/lib/admin/home-actions'

type ProductOption = { id: string; name: string; sku: string | null }
type Sections = { featuredTitle: string; featuredProductIds: string[] }

export default function SectionsForm({
  initial,
  products,
}: {
  initial: Sections
  products: ProductOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [featuredTitle, setFeaturedTitle] = useState(initial.featuredTitle)
  const [selected, setSelected] = useState<string[]>(initial.featuredProductIds)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products.slice(0, 30)
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q))
      .slice(0, 30)
  }, [search, products])

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    startTransition(async () => {
      const result = await updateSectionsAction({ featuredTitle, featuredProductIds: selected })
      if (!result.success) {
        setError(result.fields?.[0]?.message ?? result.error)
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  const inputClass =
    'border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container w-full'

  return (
    <form onSubmit={submit} className="p-4 md:p-6 flex flex-col gap-5 max-w-2xl">
      <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Secciones</h1>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-black uppercase text-on-surface tracking-wider">Título de destacados</span>
        <input className={inputClass} value={featuredTitle} onChange={(e) => setFeaturedTitle(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-black uppercase text-on-surface tracking-wider">
          Productos destacados ({selected.length})
        </span>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((id) => (
              <span key={id} className="bg-primary-container text-on-primary text-xs font-bold px-2 py-1 flex items-center gap-1">
                {byId.get(id)?.name ?? 'Producto'}
                <button type="button" onClick={() => toggle(id)} className="hover:opacity-70">
                  <span className="material-symbols-outlined text-sm align-middle">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          className={inputClass}
          placeholder="Buscar producto para destacar…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="border border-surface-container divide-y divide-surface-container max-h-72 overflow-y-auto">
          {filtered.map((p) => (
            <label key={p.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface">
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
              <span className="text-xs font-bold text-on-surface truncate">{p.name}</span>
              <span className="text-xs text-on-surface-variant ml-auto">{p.sku ?? ''}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-xs text-on-surface-variant">Sin resultados</div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      {saved && <p className="text-sm text-green-700 font-medium">Guardado ✓</p>}

      <button type="submit" disabled={pending} className="bg-primary-container text-on-primary font-black uppercase py-3 px-6 self-start disabled:opacity-50">
        {pending ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  )
}
