import Image from 'next/image'
import Link from 'next/link'
import HamburgerMenu from './components/HamburgerMenu'
import SearchBar from './components/SearchBar'
import CartHeader from './components/CartHeader'
import { getHomeConfig } from '@/lib/db/queries/store-settings'
import { getCategories } from '@/lib/db/queries/categories'
import { getCardsByIds, getFeaturedCards } from '@/lib/db/queries/catalog'
import { safe } from '@/lib/db/safe'
import { formatPrice } from '@/lib/catalog/format'

export const revalidate = 300

export default async function Home() {
  const config = await safe(
    () => getHomeConfig(),
    { hero: { imageUrl: '', title: 'Moreno Herramientas', ctaText: 'Buscar' }, sections: { featuredTitle: 'Destacados', featuredProductIds: [] } },
  )
  const rootCategories = (await safe(() => getCategories(), [])).slice(0, 6)
  const featured =
    config.sections.featuredProductIds.length > 0
      ? await safe(() => getCardsByIds(config.sections.featuredProductIds), [])
      : await safe(() => getFeaturedCards(4), [])

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

      <main className="flex flex-col gap-8 md:gap-12 pt-16">
        <section
          className="relative bg-cover bg-center flex flex-col h-[calc(100dvh-4rem)] md:h-auto md:min-h-[600px]"
          style={config.hero.imageUrl ? { backgroundImage: `url('${config.hero.imageUrl}')` } : { backgroundColor: '#1f2937' }}
        >
          <div className="absolute inset-0 bg-primary-container/35" />
          <div className="relative z-10 flex flex-col gap-6 px-4 md:px-16 py-12 md:py-20 max-w-[1280px] mx-auto w-full justify-center h-full">
            <h2 className="text-4xl md:text-6xl leading-[1.1] text-on-primary font-black tracking-tighter uppercase text-center drop-shadow-lg">
              {config.hero.title}
            </h2>
            <SearchBar />
          </div>
        </section>

        {rootCategories.length > 0 && (
          <section className="px-4 md:px-16 flex flex-col gap-4 max-w-[1280px] mx-auto w-full">
            <h3 className="text-2xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">Categorías</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {rootCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="bg-charcoal aspect-square p-4 flex flex-col justify-between group border border-transparent hover:border-accent-red transition-all duration-300"
                >
                  <span className="text-on-primary text-xs font-black uppercase leading-tight">{cat.name}</span>
                  <span className="material-symbols-outlined text-accent-red self-end group-hover:translate-x-1 transition-transform duration-200">arrow_forward</span>
                </Link>
              ))}
            </div>
            <Link
              href="/categorias"
              className="w-full border-2 border-primary-container text-primary-container py-4 uppercase font-black tracking-widest text-sm hover:bg-primary-container hover:text-on-primary transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Ver todas las categorías
              <span className="material-symbols-outlined text-xl">grid_view</span>
            </Link>
          </section>
        )}

        {featured.length > 0 && (
          <section className="px-4 md:px-16 flex flex-col gap-4 max-w-[1280px] mx-auto w-full">
            <h3 className="text-2xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">{config.sections.featuredTitle}</h3>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
              {featured.map((product) => (
                <Link
                  key={product.id}
                  href={`/producto/${product.slug}`}
                  className="bg-white flex items-center p-3 gap-4 hover:bg-gray-50 transition-all duration-200 border border-black-100"
                >
                  <div className="w-20 h-20 flex-shrink-0 relative overflow-hidden">
                    <Image src={product.imageUrl ?? '/file.svg'} alt={product.name} fill sizes="80px" className="object-contain p-1" unoptimized />
                  </div>
                  <div className="flex flex-col flex-grow min-w-0">
                    <span className="text-on-surface text-xs font-bold uppercase opacity-60">{product.brand ?? ''}</span>
                    <span className="text-on-surface text-sm font-black uppercase truncate">{product.name}</span>
                    <span className="text-accent-red text-2xl font-semibold mt-1 leading-none">{formatPrice(product.price)}</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface/40 flex-shrink-0">chevron_right</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="bg-accent-red px-4 md:px-16 py-10 flex flex-col gap-4 text-center items-center relative overflow-hidden">
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-on-primary relative z-10">¿Necesitás asesoramiento técnico?</h3>
          <p className="text-on-primary font-medium relative z-10 max-w-md text-base">Escribinos por WhatsApp y un especialista te ayudará a elegir la herramienta adecuada.</p>
          <a
            href="https://wa.me/5491100000000"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-container text-on-primary font-black text-sm py-4 px-8 w-full md:w-auto uppercase tracking-widest mt-2 relative z-10 flex items-center justify-center gap-3 shadow-lg"
          >
            <span className="material-symbols-outlined">chat</span>
            Escribinos ahora
          </a>
        </section>
      </main>

      <footer className="bg-primary-container w-full mt-8 md:mt-12 border-t-4 border-accent-red">
        <div className="max-w-[1280px] mx-auto flex flex-col p-4 md:p-16 gap-6">
          <h2 className="text-2xl font-black text-on-primary uppercase tracking-tighter">Moreno Herramientas</h2>
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-white/60">© 2024 Moreno Herramientas. Calidad y Precisión Industrial.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
