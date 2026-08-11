import Image from 'next/image'
import Link from 'next/link'
import HamburgerMenu from './HamburgerMenu'
import CartHeader from './CartHeader'
import DesktopNav from './desktop/DesktopNav'

/**
 * Navbar del storefront. Es `fixed` y mide 64px en los dos layouts, así que
 * las páginas que lo usan compensan con `pt-16` sin importar el ancho.
 *
 * Hay dos layouts distintos, no uno adaptado:
 *  - < 1024px (mobile y tablet): hamburguesa · logo · carrito. El menú lateral
 *    lleva adentro el buscador y las categorías.
 *  - ≥ 1024px (desktop): ver `desktop/DesktopNav`.
 *
 * El corte va en `lg` y no en `md` porque md son 768px, que es una tablet: ahí
 * el menú lateral sigue siendo mejor que una barra de categorías apretada.
 *
 * No lo usa /categorias: esa página tiene su propio header de navegación
 * (fondo navy, botón de volver y contador) que cumple otra función.
 */
export default function StoreHeader() {
  return (
    <header className="bg-surface-container-lowest fixed top-0 left-0 right-0 z-50 border-b-2 border-primary-container">
      {/* Mobile y tablet */}
      <div className="lg:hidden max-w-[1280px] mx-auto flex justify-between items-center px-4 md:px-16 h-16">
        <HamburgerMenu />
        <Link href="/" className="shrink-0" aria-label="Moreno Herramientas — Inicio">
          <Image
            src="/logo.png"
            alt="Moreno Herramientas"
            width={127}
            height={40}
            priority
            className="h-8 md:h-10 w-auto"
          />
        </Link>
        <CartHeader />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopNav />
      </div>
    </header>
  )
}
