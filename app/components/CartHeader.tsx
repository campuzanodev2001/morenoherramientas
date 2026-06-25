'use client'

import { useCart } from '@/app/context/CartContext'

export default function CartHeader() {
  const { totalItems, openDrawer } = useCart()

  return (
    <button
      onClick={openDrawer}
      className="text-primary-container p-2 relative"
      aria-label={`Abrir carrito (${totalItems} ${totalItems === 1 ? 'producto' : 'productos'})`}
    >
      <span className="material-symbols-outlined">shopping_cart</span>
      {totalItems > 0 && (
        <span className="absolute top-0 right-0 bg-accent-red text-on-primary text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center leading-none px-0.5">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  )
}
