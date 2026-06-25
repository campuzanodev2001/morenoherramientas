'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/app/context/CartContext'
import { formatPrice } from '@/lib/catalog/format'

export default function CartDrawer() {
  const {
    items,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    stockWarnings,
    isDrawerOpen,
    closeDrawer,
    error,
  } = useCart()

  // Cerrar con Escape mientras está abierto.
  useEffect(() => {
    if (!isDrawerOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDrawerOpen, closeDrawer])

  const empty = items.length === 0

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-200 ${
          isDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed top-0 right-0 z-[70] h-dvh w-full max-w-[400px] bg-surface-container-lowest border-l-2 border-primary-container flex flex-col shadow-2xl transition-transform duration-200 ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between px-5 h-16 border-b-2 border-charcoal flex-shrink-0">
          <h2 className="text-base font-black uppercase tracking-wide text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined">shopping_cart</span>
            Carrito
            {totalItems > 0 && (
              <span className="bg-accent-red text-on-primary text-xs font-black min-w-[20px] h-5 flex items-center justify-center px-1">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </h2>
          <button
            onClick={closeDrawer}
            className="text-on-surface-variant hover:text-accent-red transition-colors"
            aria-label="Cerrar carrito"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {error && (
          <p className="px-5 py-2 text-xs font-bold text-accent-red bg-accent-red/10 border-b border-accent-red/30">
            {error}
          </p>
        )}

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span
              className="material-symbols-outlined text-[64px] text-on-surface-variant/30"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shopping_cart
            </span>
            <p className="text-sm font-black uppercase text-on-surface-variant">
              Tu carrito está vacío
            </p>
            <Link
              href="/"
              onClick={closeDrawer}
              className="border-2 border-primary-container text-primary-container font-black uppercase tracking-widest py-2.5 px-6 text-xs hover:bg-primary-container hover:text-on-primary transition-colors"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 items-start">
                  <div className="relative w-16 h-16 flex-shrink-0 bg-white border border-outline overflow-hidden">
                    <Image
                      src={product.image ?? '/file.svg'}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-grow min-w-0">
                    <span className="text-xs font-black uppercase leading-tight text-on-surface line-clamp-2">
                      {product.name}
                    </span>
                    {stockWarnings.has(product.id) && (
                      <span className="text-[10px] font-black uppercase text-accent-red">
                        Solo {product.stock} en stock
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center border-2 border-charcoal">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          disabled={quantity <= 1}
                          className="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-accent-red hover:text-on-primary transition-colors disabled:opacity-30"
                          aria-label="Reducir cantidad"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="w-8 h-6 flex items-center justify-center text-xs font-black border-x-2 border-charcoal">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stock}
                          className="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-accent-red hover:text-on-primary transition-colors disabled:opacity-30"
                          aria-label="Aumentar cantidad"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                      <span className="text-sm font-black text-accent-red">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(product.id)}
                    className="text-on-surface-variant hover:text-accent-red transition-colors flex-shrink-0"
                    aria-label="Eliminar producto"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              ))}
            </div>

            <footer className="border-t-2 border-charcoal p-5 flex flex-col gap-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <span className="font-black uppercase tracking-wide text-on-surface text-sm">
                  Subtotal
                </span>
                <span className="text-xl font-black text-accent-red">{formatPrice(totalPrice)}</span>
              </div>
              <Link
                href="/carrito"
                onClick={closeDrawer}
                className="text-center text-xs font-black uppercase tracking-widest text-primary-container hover:text-accent-red transition-colors"
              >
                Ver carrito
              </Link>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                aria-disabled={empty}
                className="w-full bg-accent-red text-on-primary font-black uppercase tracking-widest py-3.5 text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
                Ir al checkout
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
