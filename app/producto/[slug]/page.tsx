import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import HamburgerMenu from '@/app/components/HamburgerMenu'
import CartHeader from '@/app/components/CartHeader'
import ProductCard from '@/app/components/ProductCard'
import ProductGallery from './ProductGallery'
import AddToCartButton from './AddToCartButton'
import { getProductBySlug } from '@/lib/db/queries/products'
import { getRelatedCards } from '@/lib/db/queries/catalog'
import { getRecentProductSlugs } from '@/lib/db/queries/catalog'
import { safe } from '@/lib/db/safe'
import { formatPrice } from '@/lib/catalog/format'
import { clientEnv } from '@/lib/env'
import type { CartProductRef } from '@/app/context/CartContext'

export const revalidate = 300

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await safe(() => getRecentProductSlugs(200), [])
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await safe(() => getProductBySlug(slug), null)
  if (!product) return { title: 'Producto no encontrado — Moreno Herramientas' }
  const image = product.images[0]?.url
  return {
    title: `${product.name} — Moreno Herramientas`,
    description: product.description?.slice(0, 160) ?? undefined,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  }
}

function stockBadge(stock: number) {
  if (stock === 0) return { label: 'Sin stock', className: 'bg-accent-red text-on-primary' }
  if (stock <= 5) return { label: 'Últimas unidades', className: 'border-2 border-accent-red text-accent-red' }
  return { label: 'Disponible', className: 'bg-charcoal text-on-primary' }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await safe(() => getProductBySlug(slug), null)
  if (!product) notFound()

  const related = await safe(() => getRelatedCards(product.categoryId, product.id, 5), [])
  const badge = stockBadge(product.stock)
  const images = product.images.map((img) => img.url)
  const cartRef: CartProductRef = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: images[0] ?? null,
    stock: product.stock,
  }
  const whatsappMessage = encodeURIComponent(
    `Hola, me interesa el producto: ${product.name}${product.sku ? ` (SKU: ${product.sku})` : ''}`,
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    sku: product.sku ?? undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    image: images,
    offers: {
      '@type': 'Offer',
      price: (product.price / 100).toFixed(2),
      priceCurrency: 'ARS',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${clientEnv.NEXT_PUBLIC_APP_URL}/producto/${product.slug}`,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="bg-surface-container-lowest fixed top-0 left-0 right-0 z-50 border-b-2 border-primary-container">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center px-4 md:px-16 h-16">
          <HamburgerMenu />
          <Link href="/" className="text-lg md:text-xl font-extrabold text-primary-container uppercase tracking-tighter">
            Moreno Herramientas
          </Link>
          <CartHeader />
        </div>
      </header>

      <main className="pt-16 flex flex-col">
        <div className="border-b border-outline bg-surface-container-lowest">
          <nav className="max-w-[1280px] mx-auto px-4 md:px-16 py-3 flex items-center gap-1.5 flex-wrap text-xs font-medium text-on-surface-variant">
            <Link href="/" className="hover:text-accent-red transition-colors uppercase tracking-wide">Inicio</Link>
            {product.category && (
              <>
                <span className="text-outline">/</span>
                <Link href={`/categoria/${product.category.slug}`} className="hover:text-accent-red transition-colors uppercase tracking-wide">
                  {product.category.name}
                </Link>
              </>
            )}
            <span className="text-outline">/</span>
            <span className="text-on-surface font-bold uppercase tracking-wide">{product.name}</span>
          </nav>
        </div>

        <section className="max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8">
          <div className="grid md:grid-cols-[3fr_2fr] gap-8 lg:gap-16">
            <ProductGallery images={images} productName={product.name} />

            <div className="flex flex-col gap-5 min-w-0">
              <div className="flex items-center justify-between gap-4">
                {product.brand && (
                  <span className="font-black text-xs uppercase tracking-widest text-primary-container border-b-2 border-current pb-0.5 shrink-0">
                    {product.brand}
                  </span>
                )}
                {product.sku && (
                  <span className="text-xs text-on-surface-variant text-right">
                    SKU: <strong className="text-on-surface font-black">{product.sku}</strong>
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black uppercase leading-tight text-on-surface">{product.name}</h1>

              <span className={`self-start px-3 py-1.5 text-xs font-black uppercase tracking-widest ${badge.className}`}>
                {badge.label}
              </span>

              <div className="border-l-4 border-accent-red pl-4 py-1">
                <p className="text-4xl font-black text-accent-red leading-none">{formatPrice(product.price)}</p>
                {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                  <p className="text-sm text-on-surface-variant line-through mt-1">{formatPrice(product.compareAtPrice)}</p>
                )}
                <p className="text-xs text-on-surface-variant mt-1.5 font-medium">Precio final · IVA incluido</p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <AddToCartButton product={cartRef} />
                <a
                  href={`https://wa.me/5491100000000?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border-2 border-primary-container text-primary-container font-black uppercase tracking-widest py-4 text-sm flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary transition-colors duration-150"
                >
                  <span className="material-symbols-outlined">chat</span>
                  Consultar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {(product.description || product.specs.length > 0) && (
          <section className="border-t-2 border-charcoal">
            <div className="max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8 grid md:grid-cols-2 gap-8 lg:gap-16">
              {product.description && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">Descripción</h2>
                  <p className="text-base text-on-surface-variant leading-7 font-medium whitespace-pre-line">{product.description}</p>
                </div>
              )}
              {product.specs.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">Especificaciones técnicas</h2>
                  <table className="w-full border-collapse border-2 border-charcoal">
                    <tbody>
                      {product.specs.map(({ label, value }, i) => (
                        <tr key={label} className={i % 2 === 0 ? 'bg-surface-container' : 'bg-surface-container-lowest'}>
                          <td className="border border-outline px-3 py-2.5 text-xs font-black uppercase tracking-wide text-on-surface-variant w-2/5">{label}</td>
                          <td className="border border-outline px-3 py-2.5 text-sm font-bold text-on-surface">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="border-t-2 border-charcoal py-8">
            <div className="max-w-[1280px] mx-auto w-full px-4 md:px-16 mb-4">
              <h2 className="text-xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">Productos relacionados</h2>
            </div>
            <div className="max-w-[1280px] mx-auto w-full px-4 md:px-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {related.map((card) => (
                <ProductCard key={card.id} card={card} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
