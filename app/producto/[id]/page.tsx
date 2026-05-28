import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import HamburgerMenu from "@/app/components/HamburgerMenu";
import ProductGallery from "./ProductGallery";
import ShippingCalculator from "./ShippingCalculator";
import { getProductById } from "@/lib/products";

const stockBadge = {
  available: { label: "Disponible", className: "bg-charcoal text-on-primary" },
  low: { label: "Últimas unidades", className: "border-2 border-accent-red text-accent-red" },
  out: { label: "Sin stock", className: "bg-accent-red text-on-primary" },
} as const;

const relatedProducts = [
  {
    id: 2,
    name: "Kit Puesta a Punto Universal",
    price: "$48.500",
    brand: "JONNESWAY",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDD9bl9bTcId3iiVjnMEY1BhEpaCbAbZi0F8pDWKwXhDWRxnypBmMf6eeEd08dM50bb0BXLP2vLn49yH8bAD-KECVTbHVTuxRWFq98cvvjvX8gm0p4igPZi27kmVuezMt3ZeXctzi8PHL78ArWsVyJTQz7s0G7L7wozUY7au3gmpd3Y7istIHXel57ThjXJL73XVBNfHLN_2YthWKynDW25X2sdbOqCAm5K84ugNKMbLAK5RHVbL93aQLl4_C7Bw",
  },
  {
    id: 34,
    name: "Llave de Impacto 1/2\" 600 Nm",
    price: "$168.000",
    brand: "MILWAUKEE",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCP5vKXLEfwXJr6elYHcp6fcMyMZmf1DSQLMRAjoFGdehb2LtWRp0svm44Xe7C80C4VNHdYhvWg6k0tA7CSiY1I-s0g9EwQx6hsAb6RqwcP7IzquHfo1ObAEqpf-S_L9kCWs05BniiRZ3dqRR4LJ8YTCSYD8TkQsC72-88yQmiptolrH5d7k4hJ4zl9N6BAR4b1L7n1SGFdz_AB9-A8T1vxq_n4cKfPDGOKbL3e3ody2N--SZXgGvYa9dRt7HxWnKw0oBJRRti8sF8",
  },
  {
    id: 36,
    name: "Amoladora Angular 115mm 720W",
    price: "$89.900",
    brand: "BOSCH",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD87YL24R8qpM65394RJT1PJhYsfrbwDKwoKSDP4NWmxEk8ZuRYh70GMxRcu-YR7xkAuEdeLiZGrLzPTqaXDb-DVp83-c40rUv8RFlE0rvtq_gA0XGt1vPnE15IIhcX8XZBIOdiaUr8e-7nqTzdvWoGkDM_gPi1VDYQlRqeV3ggLdIVm_cupDjslqkgdoLrplkF0-6CcKkUC4jocX-VwyhzRzv3UeJYxpBLEQ6AozDmFn6rpO4b-IlBvt0e9de9Xymtf-4vqE",
  },
  {
    id: 44,
    name: 'Sierra Circular 7-1/4" 1400W',
    price: "$112.000",
    brand: "DEWALT",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXopAoxj3i4_EGa5Wg9j-XI4QWiNxCkky2w29FMXr8c6xuLtuLe9aAfyw05ixWldZefkSOCj28vdsWacnzir-cPLQ7vzNsKaewvJWN24kapDtl8IGmP_UJcb5_3wCSe6chYeDs9tTNAII6a2mIh0oei2khYVD43SjzWI3hobUWTmn3uoH8QYbq4YNwdt4iK0s2U4KCVRRP60mDKXZuNSwSs7hJ9OqwpvBoh1WmYVM8C3qPtBIC4onJXG90gcTLgF5EgjmeeSjng70",
  },
  {
    id: 33,
    name: "Kit 20V 5 Herramientas Makita",
    price: "$385.000",
    brand: "MAKITA",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCP5vKXLEfwXJr6elYHcp6fcMyMZmf1DSQLMRAjoFGdehb2LtWRp0svm44Xe7C80C4VNHdYhvWg6k0tA7CSiY1I-s0g9EwQx6hsAb6RqwcP7IzquHfo1ObAEqpf-S_L9kCWs05BniiRZ3dqRR4LJ8YTCSYD8TkQsC72-88yQmiptolrH5d7k4hJ4zl9N6BAR4b1L7n1SGFdz_AB9-A8T1vxq_n4cKfPDGOKbL3e3ody2N--SZXgGvYa9dRt7HxWnKw0oBJRRti8sF8",
  },
];

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = getProductById(Number(id))

  if (!product) {
    notFound()
  }

  const badge = stockBadge[product.stock]
  const whatsappMessage = encodeURIComponent(
    `Hola, me interesa el producto: ${product.name} (SKU: ${product.sku})`
  )

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
          <button className="text-primary-container p-2">
            <span className="material-symbols-outlined">shopping_cart</span>
          </button>
        </div>
      </header>

      <main className="pt-16 flex flex-col">
        <div className="border-b border-outline bg-surface-container-lowest">
          <nav className="max-w-[1280px] mx-auto px-4 md:px-16 py-3 flex items-center gap-1.5 flex-wrap text-xs font-medium text-on-surface-variant">
            <Link
              href="/"
              className="hover:text-accent-red transition-colors uppercase tracking-wide"
            >
              Inicio
            </Link>
            <span className="text-outline">/</span>
            <Link
              href="#"
              className="hover:text-accent-red transition-colors uppercase tracking-wide"
            >
              {product.category}
            </Link>
            {product.subcategory && (
              <>
                <span className="text-outline">/</span>
                <Link
                  href="#"
                  className="hover:text-accent-red transition-colors uppercase tracking-wide"
                >
                  {product.subcategory}
                </Link>
              </>
            )}
            <span className="text-outline">/</span>
            <span className="text-on-surface font-bold uppercase tracking-wide">
              {product.name}
            </span>
          </nav>
        </div>

        <section className="max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8">
          <div className="grid md:grid-cols-[3fr_2fr] gap-8 lg:gap-16">
            <ProductGallery images={product.images} productName={product.name} />

            <div className="flex flex-col gap-5 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <Link
                  href="#"
                  className="font-black text-xs uppercase tracking-widest text-primary-container hover:text-accent-red transition-colors border-b-2 border-current pb-0.5 shrink-0"
                >
                  {product.brand}
                </Link>
                <span className="text-xs text-on-surface-variant text-right">
                  SKU:{" "}
                  <strong className="text-on-surface font-black">{product.sku}</strong>
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black uppercase leading-tight text-on-surface">
                {product.name}
              </h1>

              <span
                className={`self-start px-3 py-1.5 text-xs font-black uppercase tracking-widest ${badge.className}`}
              >
                {badge.label}
              </span>

              <div className="border-l-4 border-accent-red pl-4 py-1">
                <p className="text-4xl font-black text-accent-red leading-none">
                  {product.price}
                </p>
                <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
                  Precio final · IVA incluido
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button className="w-full bg-accent-red text-on-primary font-black uppercase tracking-widest py-4 text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    shopping_cart
                  </span>
                  Agregar al carrito
                </button>
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

              <ShippingCalculator />
            </div>
          </div>
        </section>

        <section className="border-t-2 border-charcoal">
          <div className="max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">
                  Descripción
                </h2>
                <p className="text-base text-on-surface-variant leading-7 font-medium">
                  {product.description}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">
                  Especificaciones técnicas
                </h2>
                <table className="w-full border-collapse border-2 border-charcoal">
                  <tbody>
                    {product.specs.map(({ label, value }, i) => (
                      <tr
                        key={label}
                        className={
                          i % 2 === 0
                            ? "bg-surface-container"
                            : "bg-surface-container-lowest"
                        }
                      >
                        <td className="border border-outline px-3 py-2.5 text-xs font-black uppercase tracking-wide text-on-surface-variant w-2/5">
                          {label}
                        </td>
                        <td className="border border-outline px-3 py-2.5 text-sm font-bold text-on-surface">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t-2 border-charcoal py-8 overflow-x-hidden">
          <div className="max-w-[1280px] mx-auto w-full px-4 md:px-16 mb-4">
            <h2 className="text-xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">
              Productos relacionados
            </h2>
          </div>
          <div className="overflow-x-auto w-full">
            <div className="flex gap-3 pb-4 px-4 md:px-16 w-max">
              {relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/producto/${rel.id}`}
                  className="flex flex-col bg-charcoal w-44 flex-shrink-0 group border-b-4 border-transparent hover:border-accent-red transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                >
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={rel.image}
                      alt={rel.name}
                      fill
                      sizes="176px"
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-primary/60">
                      {rel.brand}
                    </span>
                    <span className="text-xs font-black uppercase leading-tight text-on-primary line-clamp-2">
                      {rel.name}
                    </span>
                    <span className="text-accent-red text-lg font-black leading-none mt-auto pt-2">
                      {rel.price}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary-container w-full border-t-4 border-accent-red">
        <div className="max-w-[1280px] mx-auto flex flex-col p-4 md:p-16 gap-6">
          <h2 className="text-2xl font-black text-on-primary uppercase tracking-tighter">
            Moreno Herramientas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <nav className="flex flex-col gap-3">
              <Link
                href="#"
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
              >
                Herramientas
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
              >
                Marcas
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
              >
                Ofertas
              </Link>
            </nav>
            <nav className="flex flex-col gap-3">
              <Link
                href="#"
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
              >
                Mi Cuenta
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
              >
                Contacto
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
              >
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
  );
}
