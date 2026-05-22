import Image from "next/image";
import HamburgerMenu from "./components/HamburgerMenu";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCO_LAsdBrffs-Kq3gJVnxK7aX8bAmBBkbWGo7xXdkHhH1JcnGiVDK39vS3H29lEzSXhUqksdlEH1iCkL7rJQ6MqlyNz4aVOsncK-fyQq5dI3ymUVYlysSIW8U61C0apkUihGCNh8gb0Lya2fljGjPFsMbPYYbWlWAuUM02vGvgHD-0RjVdNFwcYsmSvHFJ0zd2uILSeQLwJ5cREPzGfGQ_8EKcsGCOlmdVBI9o1WvnIlmbMEPhMqWWOYdg7s9G9EQyzo-1vIlSAfY";

const categories = [
  "Herramientas",
  "Tornillería",
  "Plomería",
  "Electricidad",
  "Pintura",
  "Construcción",
];

const products = [
  {
    id: 1,
    category: "Herramientas Eléctricas",
    name: "Taladro Percutor 20V MAX",
    price: "$145.000",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCP5vKXLEfwXJr6elYHcp6fcMyMZmf1DSQLMRAjoFGdehb2LtWRp0svm44Xe7C80C4VNHdYhvWg6k0tA7CSiY1I-s0g9EwQx6hsAb6RqwcP7IzquHfo1ObAEqpf-S_L9kCWs05BniiRZ3dqRR4LJ8YTCSYD8TkQsC72-88yQmiptolrH5d7k4hJ4zl9N6BAR4b1L7n1SGFdz_AB9-A8T1vxq_n4cKfPDGOKbL3e3ody2N--SZXgGvYa9dRt7HxWnKw0oBJRRti8sF8",
  },
  {
    id: 2,
    category: "Maquinaria",
    name: "Amoladora Angular 115MM",
    price: "$89.900",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD87YL24R8qpM65394RJT1PJhYsfrbwDKwoKSDP4NWmxEk8ZuRYh70GMxRcu-YR7xkAuEdeLiZGrLzPTqaXDb-DVp83-c40rUv8RZvVMKFlE0rvtq_gA0XGt1vPnE15IIhcX8XZBIOdiaUr8e-7nqTzdvWoGkDM_gPi1VDYQlRqeV3ggLdIVm_cupDjslqkgdoLrplkF0-6CcKkUC4jocX-VwyhzRzv3UeJYxpBLEQ6AozDmFn6rpO4b-IlBvt0e9de9Xymtf-4vqE",
  },
  {
    id: 3,
    category: "Medición",
    name: "Medidor Láser 50M",
    price: "$65.500",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDD9bl9bTcId3iiVjnMEY1BhEpaCbAbZi0F8pDWKwXhDWRxnypBmMf6eeEd08dM50bb0BXLP2vLn49yH8bAD-KECVTbHMIRZdioHS0vohVRXuxRWFq98cvvjvX8gm0p4igPZi27kmVuezMt3ZeXctzi8PHL78ArWsVyJTQz7s0G7L7wozUY7au3gmpd3Y7istIHXel57ThjXJL73XVBNfHLN_2YthWKynDW25X2sdbOqCAm5K84ugNKMbLAK5RHVbL93aQLl4_C7Bw",
  },
  {
    id: 4,
    category: "Carpintería",
    name: 'Sierra Circular 7 1/4"',
    price: "$112.000",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCXopAoxj3i4_EGa5Wg9j-XI4QWiNxCkky2w29FMXr8c6xuLtuLe9aAfyw05ixWldZefkSOCj28vdsWacnzir-cPLQ7vzNsKaewvJWN24kapDtl8IGmP_UJcb5_3wCSe6chYeDs9tTNAII6a2mIh0oei2khYVD43SjzWI3hobUWTmn3uoH8QYbq4YNwdt4iK0s2U4KCVRRP60mDKXZuNSwSs7hJ9OqwpvBoh1WmYVM8C3qPtBIC4onJXG90gcTLgF5EgjmeeSjng70",
  },
];

export default function Home() {
  return (
    <>
      <header className="bg-surface-container-lowest fixed top-0 left-0 right-0 z-50 border-b-2 border-primary-container">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center px-4 md:px-16 h-16">
          <HamburgerMenu />
          <h1 className="text-lg md:text-xl font-extrabold text-primary-container uppercase tracking-tighter">
            Moreno Herramientas
          </h1>
          <button className="text-primary-container p-2 rounded-none">
            <span className="material-symbols-outlined">shopping_cart</span>
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-8 md:gap-12 pt-16">
        <section
          className="relative bg-cover bg-center flex flex-col justify-end min-h-[450px] md:min-h-[600px]"
          style={{ backgroundImage: `url('${heroImage}')` }}
        >
          <div className="absolute inset-0 bg-primary-container/60" />
          <div className="relative z-10 flex flex-col gap-6 px-4 md:px-16 py-12 md:py-20 max-w-[1280px] mx-auto w-full">
            <h2 className="text-4xl md:text-6xl leading-[1.1] text-on-primary font-black tracking-tighter uppercase text-center drop-shadow-lg">
              Todo para tu taller en un solo lugar
            </h2>
            <div className="flex flex-col md:flex-row gap-2 max-w-2xl mx-auto w-full">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  search
                </span>
                <input
                  className="w-full pl-10 pr-4 py-4 bg-surface-container-lowest text-on-surface border-2 border-primary-container rounded-search focus:outline-none focus:border-accent-red text-base"
                  placeholder="Buscá herramientas, repuestos..."
                  type="text"
                />
              </div>
              <button className="bg-accent-red text-on-primary py-4 px-6 flex items-center justify-center gap-2 uppercase tracking-widest font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] rounded-none whitespace-nowrap">
                Buscar productos
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-16 flex flex-col gap-4 max-w-[1280px] mx-auto w-full">
          <h3 className="text-2xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">
            Categorías
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {categories.map((name) => (
              <div
                key={name}
                className="bg-charcoal aspect-square p-4 flex flex-col justify-between group cursor-pointer border border-transparent hover:border-accent-red transition-all duration-300 rounded-none"
              >
                <span className="text-on-primary text-xs font-black uppercase leading-tight">
                  {name}
                </span>
                <span className="material-symbols-outlined text-accent-red self-end group-hover:translate-x-1 transition-transform duration-200">
                  arrow_forward
                </span>
              </div>
            ))}
          </div>
          <button className="w-full border-2 border-primary-container text-primary-container py-4 uppercase font-black tracking-widest text-sm hover:bg-primary-container hover:text-on-primary transition-colors duration-200 flex items-center justify-center gap-2 rounded-none">
            Ver todas las categorías
            <span className="material-symbols-outlined text-xl">grid_view</span>
          </button>
        </section>

        <section className="px-4 md:px-16 flex flex-col gap-4 max-w-[1280px] mx-auto w-full">
          <h3 className="text-2xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">
            Productos destacados
          </h3>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-charcoal flex items-center p-3 gap-4 cursor-pointer hover:bg-[#1a1a1a] transition-all duration-200 border-l-4 border-transparent hover:border-accent-red rounded-none"
              >
                <div className="w-20 h-20 flex-shrink-0 relative overflow-hidden border border-white/10 rounded-none">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="80px"
                    className="object-cover grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
                <div className="flex flex-col flex-grow min-w-0">
                  <span className="text-on-primary text-xs font-bold uppercase opacity-80">
                    {product.category}
                  </span>
                  <span className="text-on-primary text-sm font-black uppercase line-clamp-1">
                    {product.name}
                  </span>
                  <span className="text-accent-red text-2xl font-semibold mt-1 leading-none">
                    {product.price}
                  </span>
                </div>
                <span className="material-symbols-outlined text-on-primary flex-shrink-0">
                  chevron_right
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-accent-red px-4 md:px-16 py-10 flex flex-col gap-4 text-center items-center relative overflow-hidden rounded-none">
          <div className="absolute top-0 right-4 opacity-20 pointer-events-none">
            <span
              className="material-symbols-outlined text-[120px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              build
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-on-primary relative z-10">
            ¿Necesitás asesoramiento técnico?
          </h3>
          <p className="text-on-primary font-medium relative z-10 max-w-md text-base">
            Escribinos por WhatsApp y un especialista te ayudará a elegir la
            herramienta adecuada.
          </p>
          <button className="bg-primary-container text-on-primary font-black text-sm py-4 px-8 w-full md:w-auto uppercase tracking-widest mt-2 relative z-10 flex items-center justify-center gap-3 rounded-none shadow-lg">
            <span className="material-symbols-outlined">chat</span>
            Escribinos ahora
          </button>
        </section>
      </main>

      <footer className="bg-primary-container w-full mt-8 md:mt-12 border-t-4 border-accent-red">
        <div className="max-w-[1280px] mx-auto flex flex-col p-4 md:p-16 gap-6">
          <h2 className="text-2xl font-black text-on-primary uppercase tracking-tighter">
            Moreno Herramientas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <nav className="flex flex-col gap-3">
              <a
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
                href="#"
              >
                Herramientas
              </a>
              <a
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
                href="#"
              >
                Marcas
              </a>
              <a
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
                href="#"
              >
                Ofertas
              </a>
            </nav>
            <nav className="flex flex-col gap-3">
              <a
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
                href="#"
              >
                Mi Cuenta
              </a>
              <a
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
                href="#"
              >
                Contacto
              </a>
              <a
                className="text-sm font-medium text-white/80 hover:text-white uppercase transition-colors duration-200"
                href="#"
              >
                Sucursales
              </a>
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
