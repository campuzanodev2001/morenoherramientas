'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Product } from '@/lib/products'

export type CartItem = {
  product: Product
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | null>(null)

function parsePrice(price: string): number {
  return parseInt(price.replace(/[$\.]/g, ''), 10)
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('cart')
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch {
        // ignore corrupted storage
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('cart', JSON.stringify(items))
    }
  }, [items, hydrated])

  function addItem(product: Product) {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  function updateQuantity(productId: number, quantity: number) {
    if (quantity < 1) return
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + parsePrice(item.product.price) * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}

export { parsePrice }
