import Link from 'next/link'
import HamburgerMenu from '@/app/components/HamburgerMenu'
import SearchBar from '@/app/components/SearchBar'
import CartHeader from '@/app/components/CartHeader'
import ProductCard from '@/app/components/ProductCard'
import { searchProducts } from '@/lib/db/queries/search'
import { getCardsByIds } from '@/lib/db/queries/catalog'
import { safe } from '@/lib/db/safe'

export const dynamic = 'force-dynamic'

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const result = query
    ? await safe(() => searchProducts({ q: query, limit: 48 }), { products: [], total: 0, nextOffset: null })
    : { products: [], total: 0, nextOffset: null }
  const cards = await safe(() => getCardsByIds(result.products.map((p) => p.id)), [])

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

      <main className="mt-3 pt-16 flex flex-col gap-6 max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8 min-h-[calc(100dvh-4rem)]">
        <nav className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-on-surface-variant">
          <Link href="/" className="hover:text-accent-red transition-colors uppercase tracking-wide">Inicio</Link>
          <span className="text-outline">/</span>
          <span className="text-on-surface font-bold uppercase tracking-wide">
            {query ? `Resultados para "${query}"` : 'Búsqueda'}
          </span>
        </nav>

        <div className="max-w-2xl">
          <SearchBar />
        </div>

        {query && (
          <p className="text-sm text-on-surface-variant font-medium">
            {result.total} {result.total === 1 ? 'resultado' : 'resultados'}
          </p>
        )}

        {cards.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {cards.map((card) => (
              <ProductCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-on-surface-variant font-medium">
            {query ? 'No encontramos productos para tu búsqueda.' : 'Escribí algo para buscar productos.'}
          </div>
        )}
      </main>
    </>
  )
}
