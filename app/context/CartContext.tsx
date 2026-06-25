'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { CartProductRef } from '@/lib/db/queries/cart'
import {
  addToCartAction,
  clearCartAction,
  getCartAction,
  mergeAnonymousCartAction,
  removeCartItemAction,
  setCartItemAction,
} from '@/lib/cart/actions'
import {
  clearAnonCart,
  readAnonCart,
  writeAnonCart,
  type AnonCartItem,
} from '@/lib/cart/anonymous-cart'

export type { CartProductRef }

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
  /** Productos cuya cantidad supera el stock actual (advertencia). */
  stockWarnings: Set<string>
  ready: boolean
  error: string | null
  // Drawer
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const CartContext = createContext<CartContextType | null>(null)

/** Capa la cantidad al stock disponible, con un mínimo de 1 unidad. */
function cap(quantity: number, stock: number): number {
  return Math.min(quantity, Math.max(stock, 1))
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const authed = status === 'authenticated'

  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const prevStatus = useRef(status)

  // Persistir el carrito anónimo (localStorage + cookie) en cada cambio.
  useEffect(() => {
    if (ready && status === 'unauthenticated') writeAnonCart(items as AnonCartItem[])
  }, [items, ready, status])

  // Sincronización según el estado de sesión:
  // - anónimo: hidratar desde localStorage
  // - logueado: cargar de DB, mergeando el carrito anónimo si recién se logueó
  useEffect(() => {
    if (status === 'loading') return
    let cancelled = false

    const justLoggedIn = status === 'authenticated' && prevStatus.current !== 'authenticated'
    prevStatus.current = status

    async function sync() {
      if (status === 'unauthenticated') {
        if (!cancelled) {
          setItems(readAnonCart())
          setReady(true)
        }
        return
      }

      const result = justLoggedIn ? await mergeAnonymousCartAction() : await getCartAction()
      if (cancelled) return
      if (result.success) {
        if (justLoggedIn) clearAnonCart()
        setItems(result.cart.items.map(({ product, quantity }) => ({ product, quantity })))
      } else {
        setError(result.error)
      }
      setReady(true)
    }
    void sync()
    return () => {
      cancelled = true
    }
  }, [status])

  async function reloadFromServer() {
    const result = await getCartAction()
    if (result.success) {
      setItems(result.cart.items.map(({ product, quantity }) => ({ product, quantity })))
    }
  }

  function addItem(product: CartProductRef, quantity = 1) {
    setError(null)
    setItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id)
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id
            ? { ...it, product, quantity: cap(it.quantity + quantity, product.stock) }
            : it,
        )
      }
      return [...prev, { product, quantity: cap(quantity, product.stock) }]
    })
    setDrawerOpen(true)
    if (authed) {
      void addToCartAction(product.id, quantity).then((r) => {
        if (!r.success) {
          setError(r.error)
          void reloadFromServer()
        }
      })
    }
  }

  function removeItem(productId: string) {
    setError(null)
    setItems((prev) => prev.filter((it) => it.product.id !== productId))
    if (authed) {
      void removeCartItemAction(productId).then((r) => {
        if (!r.success) {
          setError(r.error)
          void reloadFromServer()
        }
      })
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return
    setError(null)
    setItems((prev) =>
      prev.map((it) =>
        it.product.id === productId
          ? { ...it, quantity: cap(quantity, it.product.stock) }
          : it,
      ),
    )
    if (authed) {
      void setCartItemAction(productId, quantity).then((r) => {
        if (!r.success) {
          setError(r.error)
          void reloadFromServer()
        }
      })
    }
  }

  function clearCart() {
    setError(null)
    setItems([])
    if (authed) {
      void clearCartAction().then((r) => {
        if (!r.success) {
          setError(r.error)
          void reloadFromServer()
        }
      })
    }
  }

  const totalItems = items.reduce((sum, it) => sum + it.quantity, 0)
  const totalPrice = items.reduce(
    (sum, it) => sum + it.product.price * Math.min(it.quantity, Math.max(it.product.stock, 0)),
    0,
  )
  const stockWarnings = new Set(
    items.filter((it) => it.quantity > it.product.stock).map((it) => it.product.id),
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        stockWarnings,
        ready,
        error,
        isDrawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
      }}
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
