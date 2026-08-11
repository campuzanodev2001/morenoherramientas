'use client'

import Link from 'next/link'
import { useCategories } from '../context/CategoriesContext'

/**
 * Las categorías top del footer. Es el único pedazo del footer que necesita ser
 * cliente: las categorías viven en un contexto que carga el layout raíz.
 */
export default function FooterCategories({ max = 6 }: { max?: number }) {
  const categories = useCategories()
  if (categories.length === 0) return null

  return (
    <>
      {categories.slice(0, max).map((c) => (
        <li key={c.id}>
          <Link
            href={`/categoria/${c.slug}`}
            className="text-sm text-on-primary/70 hover:text-on-primary transition-colors"
          >
            {c.name}
          </Link>
        </li>
      ))}
      <li>
        <Link
          href="/categorias"
          className="text-sm font-bold text-on-primary/90 hover:text-on-primary transition-colors"
        >
          Ver todas →
        </Link>
      </li>
    </>
  )
}
