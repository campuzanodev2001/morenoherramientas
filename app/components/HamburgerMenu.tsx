'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCategories } from '@/app/context/CategoriesContext'
import type { StoreCategory } from '@/lib/db/queries/categories'

const LINKS = [
  { label: 'Inicio', icon: 'home', href: '/' },
  { label: 'Todas las categorías', icon: 'grid_view', href: '/categorias' },
  { label: 'Mi cuenta', icon: 'person', href: '/cuenta' },
] as const

export default function HamburgerMenu() {
  const categories = useCategories()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const [selected, setSelected] = useState<StoreCategory | null>(null)

  const depth = selected ? 1 : 0

  function close() {
    setIsOpen(false)
    setSelected(null)
  }

  function handleMenuSearch() {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    close()
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`)
  }

  const panelClass = (panelDepth: number) => {
    const base =
      'absolute inset-0 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out bg-surface-container-lowest'
    if (depth === panelDepth) return `${base} translate-x-0`
    if (depth < panelDepth) return `${base} translate-x-full`
    return `${base} -translate-x-full`
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-primary-container p-2 rounded-none"
        aria-label="Abrir menú"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={close}
      />

      <nav
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 h-full w-[min(390px,90vw)] bg-surface-container-lowest z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 px-4 h-14 bg-primary-container border-b-2 border-accent-red flex-shrink-0">
          <button
            onClick={selected ? () => setSelected(null) : close}
            className="text-on-primary flex-shrink-0"
            aria-label={selected ? 'Volver' : 'Cerrar menú'}
          >
            <span className="material-symbols-outlined">{selected ? 'arrow_back' : 'close'}</span>
          </button>
          <span className="font-black text-sm text-on-primary uppercase tracking-widest truncate">
            {selected?.name ?? 'MENÚ'}
          </span>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <div className={panelClass(0)}>
            <div className="sticky top-0 bg-surface-container-lowest px-4 py-3 border-b border-outline-variant z-10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  search
                </span>
                <input
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container text-sm text-on-surface rounded-search focus:outline-none focus:ring-2 focus:ring-accent-red border border-outline-variant"
                  placeholder="Buscá un producto..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleMenuSearch()
                  }}
                />
              </div>
            </div>

            {LINKS.map(({ label, icon, href }) => (
              <Link
                key={label}
                href={href}
                onClick={close}
                className="flex items-center gap-3 px-4 py-4 border-b border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container transition-colors duration-150"
              >
                <span className="material-symbols-outlined text-xl text-outline">{icon}</span>
                {label}
              </Link>
            ))}

            <div className="px-4 py-2 bg-surface-container border-b border-outline-variant">
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                Categorías
              </span>
            </div>

            <ul>
              {categories.map((category) =>
                category.children.length > 0 ? (
                  <li key={category.id}>
                    <button
                      onClick={() => setSelected(category)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-4 text-left border-b border-outline-variant hover:bg-surface-container active:bg-surface-container transition-colors duration-150"
                    >
                      <span className="font-bold text-sm uppercase text-on-surface tracking-wide">
                        {category.name}
                      </span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-black text-on-surface-variant tabular-nums">
                          {category.productCount}
                        </span>
                        <span className="material-symbols-outlined text-accent-red">chevron_right</span>
                      </span>
                    </button>
                  </li>
                ) : (
                  <li key={category.id}>
                    <Link
                      href={`/categoria/${category.slug}`}
                      onClick={close}
                      className="flex items-center justify-between gap-2 px-4 py-4 border-b border-outline-variant hover:bg-surface-container transition-colors duration-150"
                    >
                      <span className="font-bold text-sm uppercase text-on-surface tracking-wide">
                        {category.name}
                      </span>
                      <span className="text-[10px] font-black text-on-surface-variant tabular-nums flex-shrink-0">
                        {category.productCount}
                      </span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className={panelClass(1)}>
            {selected && (
              <ul>
                <li>
                  <Link
                    href={`/categoria/${selected.slug}`}
                    onClick={close}
                    className="flex items-center px-4 py-4 border-b-2 border-accent-red text-on-surface font-bold text-sm uppercase hover:bg-surface-container transition-colors duration-150"
                  >
                    Ver todo en {selected.name}
                  </Link>
                </li>
                {selected.children.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/categoria/${sub.slug}`}
                      onClick={close}
                      className="flex items-center justify-between gap-2 px-4 py-4 border-b border-outline-variant hover:bg-surface-container transition-colors duration-150"
                    >
                      <span className="text-sm text-on-surface">{sub.name}</span>
                      <span className="text-[10px] font-black text-on-surface-variant tabular-nums flex-shrink-0">
                        {sub.productCount}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
