import Link from 'next/link'
import CheckoutFlow from '@/app/components/checkout/CheckoutFlow'
import StoreHeader from '@/app/components/StoreHeader'
import { isTransferEnabled } from '@/lib/payments/transfer'

export const metadata = { title: 'Checkout — Moreno Herramientas' }

export default function CheckoutPage() {
  return (
    <>
      <StoreHeader />

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

        <CheckoutFlow transferEnabled={isTransferEnabled()} />
      </main>
    </>
  )
}
