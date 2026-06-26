import Link from 'next/link'
import HamburgerMenu from '@/app/components/HamburgerMenu'
import CartHeader from '@/app/components/CartHeader'

export const dynamic = 'force-dynamic'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
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

      <main className="mt-16 max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">
          Mi cuenta
        </h1>
        <div className="grid md:grid-cols-[200px_1fr] gap-6 items-start">
          <nav className="flex md:flex-col gap-2">
            <Link
              href="/cuenta/perfil"
              className="text-sm font-black uppercase tracking-wide text-on-surface-variant hover:text-accent-red transition-colors py-2"
            >
              Perfil
            </Link>
            <Link
              href="/cuenta/ordenes"
              className="text-sm font-black uppercase tracking-wide text-on-surface-variant hover:text-accent-red transition-colors py-2"
            >
              Mis compras
            </Link>
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </>
  )
}
