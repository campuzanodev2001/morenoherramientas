import Link from 'next/link'
import HamburgerMenu from '@/app/components/HamburgerMenu'
import SearchBar from '@/app/components/SearchBar'
import { getAllProducts } from '@/lib/products'
import SearchResults from './SearchResults'

interface BuscarPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const allProducts = getAllProducts()

  return (
    <>
      <header className="bg-surface-container-lowest fixed top-0 left-0 right-0 z-50 border-b-2 border-primary-container">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center px-4 md:px-16 h-16">
          <HamburgerMenu />
          <Link
            href="/"
            className="text-lg md:text-xl font-extrabold text-primary-container uppercase tracking-tighter"
          >
            Moreno Herramientas
          </Link>
          <button className="text-primary-container p-2 rounded-none">
            <span className="material-symbols-outlined">shopping_cart</span>
          </button>
        </div>
      </header>

      <main className=" mt-3 pt-16 flex flex-col gap-6 max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8">
        <nav className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-on-surface-variant">
          <Link href="/" className="hover:text-accent-red transition-colors uppercase tracking-wide">
            Inicio
          </Link>
          <span className="text-outline">/</span>
          <span className="text-on-surface font-bold uppercase tracking-wide">
            {query ? `Resultados para "${query}"` : 'Búsqueda'}
          </span>
        </nav>

        <div className="max-w-2xl">
          <SearchBar />
        </div>

        <SearchResults query={query} products={allProducts} />
      </main>

      <footer className="bg-primary-container w-full mt-8 md:mt-12 border-t-4 border-accent-red">
        <div className="max-w-[1280px] mx-auto flex flex-col p-4 md:p-16 gap-6">
          <h2 className="text-2xl font-black text-on-primary uppercase tracking-tighter">
            Moreno Herramientas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <nav className="flex flex-col gap-3">
              <Link href="#" className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200">
                Herramientas
              </Link>
              <Link href="#" className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200">
                Marcas
              </Link>
              <Link href="#" className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200">
                Ofertas
              </Link>
            </nav>
            <nav className="flex flex-col gap-3">
              <Link href="#" className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200">
                Mi Cuenta
              </Link>
              <Link href="#" className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200">
                Contacto
              </Link>
              <Link href="#" className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200">
                Sucursales
              </Link>
            </nav>
          </div>
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-white/60">
              © 2024 Moreno Herramientas. Calidad y Precisión Industrial.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
