import Link from 'next/link'
import HamburgerMenu from '@/app/components/HamburgerMenu'
import CartHeader from '@/app/components/CartHeader'
import CheckoutFlow from '@/app/components/checkout/CheckoutFlow'

export const metadata = { title: 'Checkout — Moreno Herramientas' }

export default function CheckoutPage() {
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
          <CartHeader />
        </div>
      </header>

      <main className="mt-16 max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/carrito"
            className="text-on-surface-variant hover:text-accent-red transition-colors"
            aria-label="Volver al carrito"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">
            Checkout
          </h1>
        </div>

        <CheckoutFlow />
      </main>
    </>
  )
}
