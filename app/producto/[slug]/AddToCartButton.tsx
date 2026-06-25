'use client'

import { useState } from 'react'
import { useCart, type CartProductRef } from '@/app/context/CartContext'

export default function AddToCartButton({ product }: { product: CartProductRef }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      onClick={handleAdd}
      disabled={product.stock === 0}
      className="w-full bg-accent-red text-on-primary font-black uppercase tracking-widest py-4 text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
    >
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
        {added ? 'check_circle' : 'shopping_cart'}
      </span>
      {added ? '¡Agregado!' : 'Agregar al carrito'}
    </button>
  )
}
