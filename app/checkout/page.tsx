'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/app/context/CartContext'
import HamburgerMenu from '@/app/components/HamburgerMenu'
import CartHeader from '@/app/components/CartHeader'

type PaymentMethod = 'efectivo' | 'transferencia' | 'mercadopago'
type ShippingMethod = 'retiro' | 'andreani' | 'estandar'

const paymentOptions: { id: PaymentMethod; label: string; detail: string; surcharge: number }[] = [
  { id: 'efectivo', label: 'Efectivo', detail: 'Pago en tienda al retirar', surcharge: 0 },
  { id: 'transferencia', label: 'Transferencia bancaria', detail: 'CBU / Alias al finalizar', surcharge: 0 },
  { id: 'mercadopago', label: 'Mercado Pago', detail: '+5% por uso de plataforma', surcharge: 0.05 },
]

const shippingOptions: { id: ShippingMethod; label: string; detail: string; cost: number }[] = [
  { id: 'retiro', label: 'Retiro en tienda', detail: 'Lunes a sábado 9:00–18:00', cost: 0 },
  { id: 'andreani', label: 'Andreani', detail: '3–5 días hábiles', cost: 350000 },
  { id: 'estandar', label: 'Envío estándar', detail: '5–7 días hábiles', cost: 250000 },
]

function formatPrice(cents: number): string {
  return '$' + Math.round(cents / 100).toLocaleString('es-AR')
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const [payment, setPayment] = useState<PaymentMethod>('efectivo')
  const [shipping, setShipping] = useState<ShippingMethod>('retiro')
  const [confirmed, setConfirmed] = useState(false)

  const selectedPayment = paymentOptions.find((o) => o.id === payment)!
  const selectedShipping = shippingOptions.find((o) => o.id === shipping)!

  const subtotal = totalPrice
  const shippingCost = selectedShipping.cost
  const paymentSurcharge = Math.round(subtotal * selectedPayment.surcharge)
  const finalPrice = subtotal + shippingCost + paymentSurcharge

  function handleConfirm() {
    setConfirmed(true)
    clearCart()
  }

  if (confirmed) {
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

        <main className="mt-16 max-w-[1280px] mx-auto w-full px-4 md:px-16 flex flex-col items-center justify-center gap-6 py-20 text-center min-h-[calc(100dvh-4rem)]">
          <span
            className="material-symbols-outlined text-[80px] text-accent-red"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black uppercase text-on-surface">
              ¡Pedido confirmado!
            </h1>
            <p className="text-base text-on-surface-variant font-medium max-w-md">
              Recibimos tu pedido. Nos contactaremos a la brevedad para coordinar el pago y la entrega.
            </p>
          </div>
          <Link
            href="/"
            className="bg-accent-red text-on-primary font-black uppercase tracking-widest py-4 px-8 text-sm flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
          >
            <span className="material-symbols-outlined">home</span>
            Volver al inicio
          </Link>
        </main>
      </>
    )
  }

  if (items.length === 0) {
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
        <main className="mt-16 max-w-[1280px] mx-auto w-full px-4 md:px-16 flex flex-col items-center justify-center gap-6 py-20 text-center min-h-[calc(100dvh-4rem)]">
          <p className="text-xl font-black uppercase text-on-surface-variant">
            No hay productos en el carrito
          </p>
          <Link
            href="/"
            className="border-2 border-primary-container text-primary-container font-black uppercase tracking-widest py-3 px-8 text-sm hover:bg-primary-container hover:text-on-primary transition-colors"
          >
            Ver productos
          </Link>
        </main>
      </>
    )
  }

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

        <div className="grid md:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="flex flex-col gap-6">
            <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-4">
              <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-3">
                Método de pago
              </h2>
              <div className="flex flex-col gap-2">
                {paymentOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-colors ${
                      payment === option.id
                        ? 'border-primary-container bg-primary-container/5'
                        : 'border-outline hover:border-primary-container/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.id}
                      checked={payment === option.id}
                      onChange={() => setPayment(option.id)}
                      className="accent-accent-red w-4 h-4 flex-shrink-0"
                    />
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="text-sm font-black uppercase tracking-wide text-on-surface">
                        {option.label}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {option.detail}
                      </span>
                    </div>
                    {option.surcharge > 0 && (
                      <span className="text-xs font-black text-accent-red uppercase">
                        +{formatPrice(Math.round(subtotal * option.surcharge))}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </section>

            <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-4">
              <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-3">
                Método de envío
              </h2>
              <div className="flex flex-col gap-2">
                {shippingOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-colors ${
                      shipping === option.id
                        ? 'border-primary-container bg-primary-container/5'
                        : 'border-outline hover:border-primary-container/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={option.id}
                      checked={shipping === option.id}
                      onChange={() => setShipping(option.id)}
                      className="accent-accent-red w-4 h-4 flex-shrink-0"
                    />
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="text-sm font-black uppercase tracking-wide text-on-surface">
                        {option.label}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {option.detail}
                      </span>
                    </div>
                    <span className={`text-sm font-black uppercase ${option.cost === 0 ? 'text-primary-container' : 'text-on-surface'}`}>
                      {option.cost === 0 ? 'Gratis' : formatPrice(option.cost)}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-5 sticky top-24">
            <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-4">
              Resumen
            </h2>

            <div className="flex flex-col gap-2">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between items-start gap-2 text-sm">
                  <span className="text-on-surface-variant font-medium leading-tight flex-1 min-w-0">
                    <span className="font-black text-on-surface">{quantity}×</span>{' '}
                    {product.name}
                  </span>
                  <span className="font-black text-on-surface flex-shrink-0">
                    {formatPrice(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t-2 border-charcoal pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant font-medium">Subtotal</span>
                <span className="font-black text-on-surface">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant font-medium">Envío</span>
                <span className={`font-black ${shippingCost === 0 ? 'text-primary-container' : 'text-on-surface'}`}>
                  {shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}
                </span>
              </div>
              {paymentSurcharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant font-medium">Comisión Mercado Pago</span>
                  <span className="font-black text-accent-red">+{formatPrice(paymentSurcharge)}</span>
                </div>
              )}
            </div>

            <div className="border-t-2 border-charcoal pt-4 flex justify-between items-center">
              <span className="font-black uppercase tracking-wide text-on-surface">Total</span>
              <span className="text-2xl font-black text-accent-red">{formatPrice(finalPrice)}</span>
            </div>

            <button
              onClick={handleConfirm}
              className="w-full bg-accent-red text-on-primary font-black uppercase tracking-widest py-4 text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
            >
              <span className="material-symbols-outlined">check</span>
              Confirmar pedido
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
