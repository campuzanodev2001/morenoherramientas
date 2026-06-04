'use client'

import Link from 'next/link'
import { useCart } from '@/app/context/CartContext'

export default function CartHeader() {
  const { totalItems } = useCart()

  return (
    <Link href="/carrito" className="text-primary-container p-2 relative">
      <span className="material-symbols-outlined">shopping_cart</span>
      {totalItems > 0 && (
        <span className="absolute top-0 right-0 bg-accent-red text-on-primary text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center leading-none px-0.5">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}
