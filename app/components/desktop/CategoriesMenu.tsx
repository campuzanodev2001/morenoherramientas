'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCategories } from '@/app/context/CategoriesContext'
import { navigableCategories } from '@/lib/catalog/store-nav'

/**
 * Botón "Categorías" con panel desplegable, solo desktop.
 *
 * Se abre al hover, pero NO solo con hover: el mouse no es el único modo de
 * navegar. También abre con click y con foco de teclado, cierra con Escape y
 * expone aria-expanded, así que funciona igual con teclado o lector de pantalla.
 *
 * El cierre por hover tiene un retardo corto a propósito: sin él, el hueco
 * entre el botón y el panel cierra el menú cuando el usuario baja el mouse en
 * diagonal hacia una categoría de la derecha.
 */

const CLOSE_DELAY_MS = 120

export default function CategoriesMenu() {
  const categories = navigableCategories(useCategories())
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Al navegar, el panel tiene que cerrarse: el hover no se "despega" solo
  // cuando el contenido debajo del mouse cambia de página. Se ajusta durante
  // el render comparando con el pathname anterior, que es el patrón que
  // recomienda React para resetear estado, en vez de un efecto con setState.
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  function scheduleClose() {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      setOpen(false)
      // Devolver el foco al botón: si no, queda perdido en el panel cerrado.
      containerRef.current?.querySelector('button')?.focus()
    }
  }

  if (categories.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose()
        setOpen(true)
      }}
      onMouseLeave={scheduleClose}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        // Solo cerrar si el foco salió del componente entero.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 h-16 px-4 text-xs font-black uppercase tracking-widest transition-colors ${
          open
            ? 'bg-accent-red text-on-primary'
            : 'text-primary-container hover:bg-surface-container'
        }`}
      >
        <span className="material-symbols-outlined text-xl">grid_view</span>
        Categorías
        <span
          className={`material-symbols-outlined text-lg transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          // -left-4 alinea el panel con el borde del botón, que tiene px-4.
          // El ancho lo manda el nombre más largo del catálogo ("Elevación y
          // equipamiento de taller"): con 720px se truncaban ocho de las 21.
          className="absolute -left-4 top-16 z-50 bg-surface-container-lowest border-2 border-charcoal shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] w-[900px] max-w-[calc(100vw-2rem)]"
        >
          <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 p-5">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categoria/${c.slug}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container hover:text-accent-red transition-colors"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-[10px] font-black text-on-surface-variant tabular-nums shrink-0">
                  {c.productCount}
                </span>
              </Link>
            ))}
          </div>

          <div className="border-t-2 border-charcoal px-5 py-3 bg-surface-container">
            <Link
              href="/categorias"
              className="text-xs font-black uppercase tracking-widest text-accent-red hover:underline flex items-center gap-1.5"
            >
              Ver todas las categorías
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
