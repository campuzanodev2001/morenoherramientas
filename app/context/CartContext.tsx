'use client'

import { createContext, useContext, useEffect, useState } from 'react'

/** Referencia mínima y serializable de un producto en el carrito. */
export type CartProductRef = {
  id: string
  slug: string
  name: string
  brand: string | null
  price: number // centavos
  image: string | null
  stock: number
}

export type CartItem = {
  product: CartProductRef
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (product: CartProductRef, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number // centavos
}

const CartContext = createContext<CartContextType | null>(null)
const STORAGE_KEY = 'cart'

function isValidItem(x: unknown): x is CartItem {
  if (!x || typeof x !== 'object') return false
  const item = x as { product?: unknown; quantity?: unknown }
  const p = item.product as { id?: unknown; price?: unknown } | undefined
  return Boolean(p) && typeof p?.id === 'string' && typeof p?.price === 'number' && typeof item.quantity === 'number'
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setItems(parsed.filter(isValidItem))
      } catch {
        // ignore corrupted storage
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  function addItem(product: CartProductRef, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        const next = Math.min(existing.quantity + quantity, Math.max(product.stock, 1))
        return prev.map((item) => (item.product.id === product.id ? { ...item, product, quantity: next } : item))
      }
      return [...prev, { product, quantity: Math.min(quantity, Math.max(product.stock, 1)) }]
    })
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, Math.max(item.product.stock, 1)) }
          : item,
      ),
    )
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

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
