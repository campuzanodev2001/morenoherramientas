'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart, parsePrice } from '@/app/context/CartContext'
import HamburgerMenu from '@/app/components/HamburgerMenu'
import CartHeader from '@/app/components/CartHeader'

function formatPrice(amount: number): string {
  return '$' + amount.toLocaleString('es-AR')
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart()

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

      <main className="mt-16 max-w-[1280px] mx-auto w-full px-4 md:px-16 py-8 flex flex-col gap-6 min-h-[calc(100dvh-4rem)]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black uppercase border-l-4 border-accent-red pl-3 text-on-surface">
            Carrito
          </h1>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-accent-red transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">delete_sweep</span>
              Vaciar carrito
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
            <span
              className="material-symbols-outlined text-[80px] text-on-surface-variant/30"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shopping_cart
            </span>
            <div className="flex flex-col gap-2">
              <p className="text-xl font-black uppercase text-on-surface-variant">
                Tu carrito está vacío
              </p>
              <p className="text-sm text-on-surface-variant font-medium">
                Agregá productos para comenzar tu compra
              </p>
            </div>
            <Link
              href="/"
              className="border-2 border-primary-container text-primary-container font-black uppercase tracking-widest py-3 px-8 text-sm hover:bg-primary-container hover:text-on-primary transition-colors duration-150"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="flex flex-col gap-2">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="bg-surface-container-lowest border-l-4 border-transparent hover:border-primary-container transition-all duration-200 flex items-center gap-4 p-4"
                >
                  <div className="relative w-20 h-20 flex-shrink-0 bg-white border border-outline overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  </div>

                  <div className="flex flex-col gap-1 flex-grow min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      {product.brand}
                    </span>
                    <span className="text-sm font-black uppercase leading-tight text-on-surface line-clamp-2">
                      {product.name}
                    </span>
                    <span className="text-accent-red text-lg font-black leading-none mt-1">
                      {formatPrice(parsePrice(product.price) * quantity)}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-on-surface-variant hover:text-accent-red transition-colors"
                      aria-label="Eliminar producto"
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <div className="flex items-center border-2 border-charcoal">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        disabled={quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-on-surface font-black hover:bg-accent-red hover:text-on-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Reducir cantidad"
                      >
                        <span className="material-symbols-outlined text-base">remove</span>
                      </button>
                      <span className="w-10 h-8 flex items-center justify-center text-sm font-black text-on-surface border-x-2 border-charcoal">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-on-surface font-black hover:bg-accent-red hover:text-on-primary transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-5 sticky top-24">
              <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-4">
                Resumen del pedido
              </h2>

              <div className="flex flex-col gap-2">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between items-start gap-2 text-sm">
                    <span className="text-on-surface-variant font-medium leading-tight flex-1 min-w-0">
                      <span className="font-black text-on-surface">{quantity}×</span>{' '}
                      {product.name}
                    </span>
                    <span className="font-black text-on-surface flex-shrink-0">
                      {formatPrice(parsePrice(product.price) * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-charcoal pt-4 flex justify-between items-center">
                <span className="font-black uppercase tracking-wide text-on-surface">Subtotal</span>
                <span className="text-2xl font-black text-accent-red">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <p className="text-xs text-on-surface-variant font-medium">
                Envío y descuentos se calculan en el checkout
              </p>

              <Link
                href="/checkout"
                className="w-full bg-accent-red text-on-primary font-black uppercase tracking-widest py-4 text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
                Ir al checkout
              </Link>

              <Link
                href="/"
                className="text-center text-xs font-black uppercase tracking-widest text-primary-container hover:text-accent-red transition-colors"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
