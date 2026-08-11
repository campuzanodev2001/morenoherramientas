'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Lupa del navbar de desktop: abre un panel con el buscador en vez de ocupar
 * lugar fijo en la barra.
 *
 * Existe porque el buscador solo vive en el hero de la home y en /buscar: sin
 * esto, alguien parado en una ficha de producto no tiene forma de buscar sin
 * volver al inicio.
 */
export default function SearchOverlay() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Al abrir, el foco va al input: si no, el usuario tiene que clickearlo.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function search() {
    const trimmed = query.trim()
    if (!trimmed) return
    setOpen(false)
    setQuery('')
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Cerrar buscador' : 'Buscar productos'}
        className={`p-2 transition-colors ${
          open ? 'text-accent-red' : 'text-primary-container hover:text-accent-red'
        }`}
      >
        <span className="material-symbols-outlined">{open ? 'close' : 'search'}</span>
      </button>

      {open && (
        <>
          {/* El velo va debajo del header (z-40 contra z-50) para que la barra
              siga visible y clickeable con el buscador abierto. */}
          <div
            className="fixed inset-0 top-16 bg-black/40 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 right-0 top-16 z-50 bg-surface-container-lowest border-b-4 border-accent-red shadow-lg">
            {/* Mismo contenedor que DesktopNav para que el buscador arranque
                alineado con el logo en todos los anchos. */}
            <div className="max-w-[1280px] mx-auto px-4 xl:px-16 py-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                    search
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') search()
                    }}
                    placeholder="Buscá herramientas, marcas, códigos…"
                    aria-label="Buscar productos"
                    className="w-full pl-10 pr-4 py-3.5 bg-surface-container-lowest text-on-surface border-2 border-primary-container rounded-search focus:outline-none focus:border-accent-red text-base"
                  />
                </div>
                <button
                  type="button"
                  onClick={search}
                  className="bg-accent-red text-on-primary py-3.5 px-6 flex items-center gap-2 uppercase tracking-widest font-black text-sm whitespace-nowrap hover:opacity-90 transition-opacity"
                >
                  Buscar
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
