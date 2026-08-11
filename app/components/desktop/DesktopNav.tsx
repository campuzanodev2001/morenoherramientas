'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import CategoriesMenu from './CategoriesMenu'
import AccountMenu from './AccountMenu'
import SearchOverlay from './SearchOverlay'
import CartHeader from '../CartHeader'
import { useCategories } from '@/app/context/CategoriesContext'
import { navigableCategories } from '@/lib/catalog/store-nav'

/**
 * Cuántas categorías van sueltas en la barra. El resto vive en el panel.
 *
 * Se revelan de a poco según el ancho porque los nombres del catálogo son
 * largos ("Destornilladores y puntas", "Bocallaves y accesorios"): con cinco
 * fijas a 1024px no entran y se cortan. Nunca se truncan — una categoría que
 * dice "Destornillad…" no le sirve a nadie.
 */
const INLINE_CATEGORIES = 5

/** Clases que ocultan cada categoría por debajo del ancho donde entra. */
const REVEAL_AT = ['', '', '', 'hidden xl:flex', 'hidden 2xl:flex'] as const

/**
 * Navbar de desktop (≥1024px). Una sola fila de 64px, la misma altura que el
 * header de mobile, así que ninguna página necesita cambiar su `pt-16`.
 *
 * No lleva barra de búsqueda: el buscador grande sigue siendo el CTA del hero
 * de la home, y desde el resto del sitio se llega por la lupa.
 */
export default function DesktopNav() {
  const pathname = usePathname()
  const inline = navigableCategories(useCategories()).slice(0, INLINE_CATEGORIES)

  return (
    <div className="max-w-[1280px] mx-auto flex items-center h-16 px-4 xl:px-16">
      <Link href="/" className="shrink-0 mr-2" aria-label="Moreno Herramientas — Inicio">
        <Image
          src="/logo.png"
          alt="Moreno Herramientas"
          width={127}
          height={40}
          priority
          className="h-10 w-auto"
        />
      </Link>

      <CategoriesMenu />

      <nav aria-label="Categorías destacadas" className="flex items-center">
        {inline.map((c, i) => {
          const href = `/categoria/${c.slug}`
          const isActive = pathname === href
          return (
            <Link
              key={c.id}
              href={href}
              className={`shrink-0 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                REVEAL_AT[i] ?? ''
              } ${isActive ? 'text-accent-red font-bold' : 'text-on-surface hover:text-accent-red'}`}
            >
              {c.name}
            </Link>
          )
        })}
      </nav>

      {/* ml-auto empuja las acciones a la derecha sin depender de que las
          categorías ocupen un ancho fijo. */}
      <div className="flex items-center gap-1 ml-auto shrink-0 pl-2">
        <SearchOverlay />
        <AccountMenu />
        <CartHeader />
      </div>
    </div>
  )
}
