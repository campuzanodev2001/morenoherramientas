'use client'

import { useRef, useState, useTransition } from 'react'
import type { HomeSection } from '@/lib/db/queries/store-settings'
import type { ProductOption } from '@/lib/db/queries/admin-products'
import { saveSectionAction, searchProductsAction } from '@/lib/admin/home-actions'

const inputClass =
  'border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container w-full'

export default function SectionEditor({
  section,
  knownProducts,
  onDone,
  onCancel,
}: {
  section?: HomeSection
  knownProducts: ProductOption[]
  onDone: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(section?.title ?? '')
  const [active, setActive] = useState(section?.active ?? true)
  const [selected, setSelected] = useState<string[]>(section?.productIds ?? [])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ProductOption[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  // Nombres de los productos ya elegidos + los que fueron apareciendo en las
  // búsquedas, para que los chips nunca queden sin texto.
  const [names, setNames] = useState<Map<string, string>>(
    () => new Map(knownProducts.map((p) => [p.id, p.name])),
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedRef = useRef(false)

  function runSearch(query: string) {
    setSearching(true)
    startTransition(async () => {
      const result = await searchProductsAction({ search: query })
      setSearching(false)
      if (!result.success) {
        setError(result.error)
        return
      }
      setNames((prev) => {
        const next = new Map(prev)
        for (const p of result.products) next.set(p.id, p.name)
        return next
      })
      setResults(result.products)
    })
  }

  function onSearchChange(value: string) {
    setSearch(value)
    loadedRef.current = true
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(value), 250)
  }

  function onSearchFocus() {
    if (loadedRef.current) return
    loadedRef.current = true
    runSearch('')
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await saveSectionAction({
        ...(section ? { id: section.id } : {}),
        title,
        productIds: selected,
        active,
      })
      if (!result.success) {
        setError(result.fields?.[0]?.message ?? result.error)
        return
      }
      onDone()
    })
  }

  return (
    <form onSubmit={submit} className="border-2 border-primary-container bg-surface p-4 flex flex-col gap-4">
      <h2 className="text-sm font-black uppercase text-on-surface tracking-wider">
        {section ? 'Editar sección' : 'Nueva sección'}
      </h2>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-black uppercase text-on-surface tracking-wider">Título</span>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Ofertas de la semana"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <span className="text-xs font-black uppercase text-on-surface tracking-wider">Visible en la home</span>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-black uppercase text-on-surface tracking-wider">
          Productos ({selected.length})
        </span>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((id) => (
              <span
                key={id}
                className="bg-primary-container text-on-primary text-xs font-bold px-2 py-1 flex items-center gap-1"
              >
                {names.get(id) ?? 'Producto'}
                <button type="button" onClick={() => toggle(id)} className="hover:opacity-70" aria-label="Quitar producto">
                  <span className="material-symbols-outlined text-sm align-middle">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          className={inputClass}
          placeholder="Buscar producto por nombre, SKU o marca…"
          value={search}
          onFocus={onSearchFocus}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="border border-surface-container divide-y divide-surface-container max-h-72 overflow-y-auto">
          {results.map((p) => (
            <label key={p.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface">
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
              <span className="text-xs font-bold text-on-surface truncate">{p.name}</span>
              <span className="text-xs text-on-surface-variant ml-auto">{p.sku ?? ''}</span>
            </label>
          ))}
          {results.length === 0 && (
            <div className="px-3 py-4 text-xs text-on-surface-variant">
              {searching ? 'Buscando…' : 'Escribí para buscar productos'}
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary-container text-on-primary font-black uppercase py-3 px-6 disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border-2 border-outline text-on-surface font-black uppercase py-3 px-6"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
