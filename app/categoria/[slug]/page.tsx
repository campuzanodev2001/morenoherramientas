import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import HamburgerMenu from '@/app/components/HamburgerMenu'
import CartHeader from '@/app/components/CartHeader'
import ProductCard from '@/app/components/ProductCard'
import { getCategoryBySlug, getCategories } from '@/lib/db/queries/categories'
import { getCategoryCards } from '@/lib/db/queries/catalog'
import { safe } from '@/lib/db/safe'

export const revalidate = 300

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const tree = await safe(() => getCategories(), [])
  return tree.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = await safe(() => getCategoryBySlug(slug), null)
  return { title: category ? `${category.name} — Moreno Herramientas` : 'Categoría — Moreno Herramientas' }
}

export default async function CategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1

  const category = await safe(() => getCategoryBySlug(slug), null)
  if (!category) notFound()

  const { cards, total, totalPages } = await safe(
    () => getCategoryCards(slug, page),
    { cards: [], total: 0, totalPages: 1 },
  )

  return (
    <>
      <header className="bg-surface-container-lowest fixed top-0 left-0 right-0 z-50 border-b-2 border-primary-container">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center px-4 md:px-16 h-16">
          <HamburgerMenu />
          <Link href="/" className="text-lg md:text-xl font-extrabold text-primary-container uppercase tracking-tighter">
            Moreno Herramientas
          </Link>
          <CartHeader />
        </div>
      </header>

      <main className="pt-16 max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8 flex flex-col gap-6 min-h-[calc(100dvh-4rem)]">
        <nav className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-on-surface-variant">
          <Link href="/" className="hover:text-accent-red transition-colors uppercase tracking-wide">Inicio</Link>
          <span className="text-outline">/</span>
          <Link href="/categorias" className="hover:text-accent-red transition-colors uppercase tracking-wide">Categorías</Link>
          <span className="text-outline">/</span>
          <span className="text-on-surface font-bold uppercase tracking-wide">{category.name}</span>
        </nav>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">{category.name}</h1>
          <span className="text-sm text-on-surface-variant font-medium">{total} productos</span>
        </div>

        {category.children.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {category.children.map((sub) => (
              <Link
                key={sub.id}
                href={`/categoria/${sub.slug}`}
                className="border-2 border-outline px-3 py-1.5 text-xs font-black uppercase text-on-surface hover:border-accent-red hover:text-accent-red transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        {cards.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {cards.map((card) => (
              <ProductCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-on-surface-variant font-medium">No hay productos en esta categoría.</div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            {page > 1 && (
              <Link href={`/categoria/${slug}?page=${page - 1}`} className="text-xs font-black uppercase text-primary-container hover:underline">← Anterior</Link>
            )}
            <span className="text-xs font-bold text-on-surface-variant">Página {page} de {totalPages}</span>
            {page < totalPages && (
              <Link href={`/categoria/${slug}?page=${page + 1}`} className="text-xs font-black uppercase text-primary-container hover:underline">Siguiente →</Link>
            )}
          </div>
        )}
      </main>
    </>
  )
}
