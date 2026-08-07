import Link from 'next/link'
import type { Metadata } from 'next'
import { getStoreCategories, type StoreCategory } from '@/lib/db/queries/categories'
import { safe } from '@/lib/db/safe'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Todas las categorías — Moreno Herramientas',
}

function CategoryCard({ category }: { category: StoreCategory }) {
  return (
    <div className="border-2 border-outline border-l-4 border-l-accent-red flex flex-col">
      <Link
        href={`/categoria/${category.slug}`}
        className="flex items-center justify-between gap-3 px-4 py-3 bg-primary-container hover:bg-primary-container/90 transition-colors group"
      >
        <span className="font-black text-sm text-on-primary uppercase tracking-wide">
          {category.name}
        </span>
        <span className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-black px-1.5 py-0.5 bg-accent-red/25 text-accent-red tabular-nums">
            {category.productCount}
          </span>
          <span className="material-symbols-outlined text-on-primary/70 group-hover:translate-x-1 transition-transform duration-200">
            arrow_forward
          </span>
        </span>
      </Link>

      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3 bg-surface-container-lowest border-t border-outline-variant">
          {category.children.map((sub) => (
            <Link
              key={sub.id}
              href={`/categoria/${sub.slug}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-outline-variant text-xs text-on-surface-variant hover:border-accent-red hover:text-accent-red transition-colors"
            >
              {sub.name}
              <span className="text-[10px] font-black tabular-nums opacity-60">
                {sub.productCount}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function CategoriasPage() {
  const categories = await safe(() => getStoreCategories(), [])
  const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0)

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-primary-container border-b-4 border-accent-red px-4 md:px-16 flex items-center justify-between h-14 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-on-primary/70 hover:text-on-primary transition-colors text-sm font-medium"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span className="hidden sm:inline uppercase tracking-wide text-xs font-bold">Inicio</span>
        </Link>

        <h1 className="font-black text-on-primary uppercase tracking-tighter text-base md:text-lg absolute left-1/2 -translate-x-1/2">
          Todas las categorías
        </h1>

        <span className="bg-accent-red text-on-primary text-[11px] font-black px-2.5 py-1 tabular-nums">
          {categories.length}
        </span>
      </header>

      <main className="flex-1 px-4 md:px-16 py-6 flex flex-col gap-4 max-w-[1280px] mx-auto w-full">
        {categories.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant font-medium">
            No hay categorías con productos disponibles en este momento.
          </div>
        ) : (
          <>
            <p className="text-sm text-on-surface-variant font-medium">
              {totalProducts} productos disponibles
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
