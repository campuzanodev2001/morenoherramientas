import Image from 'next/image'
import Link from 'next/link'
import HamburgerMenu from './HamburgerMenu'
import CartHeader from './CartHeader'

/**
 * Navbar del storefront. Es `fixed`, así que las páginas que lo usan
 * necesitan compensar los 64px de alto con `pt-16` en su contenido.
 *
 * No lo usa /categorias: esa página tiene su propio header de navegación
 * (fondo navy, botón de volver y contador) que cumple otra función.
 */
export default function StoreHeader() {
  return (
    <header className="bg-surface-container-lowest fixed top-0 left-0 right-0 z-50 border-b-2 border-primary-container">
      <div className="max-w-[1280px] mx-auto flex justify-between items-center px-4 md:px-16 h-16">
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
    </header>
  )
}
