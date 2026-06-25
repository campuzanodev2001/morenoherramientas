/**
 * Carrito anónimo: vive en `localStorage` y se espeja en una cookie para que
 * el servidor pueda leerlo y mergearlo al carrito del usuario al loguearse.
 * Solo se usa en el cliente.
 */

import type { CartProductRef } from '@/lib/db/queries/cart'

export const ANON_STORAGE_KEY = 'cart'
export const ANON_CART_COOKIE = 'anon_cart'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 días

export type AnonCartItem = { product: CartProductRef; quantity: number }

function isValidItem(x: unknown): x is AnonCartItem {
  if (!x || typeof x !== 'object') return false
  const item = x as { product?: unknown; quantity?: unknown }
  const p = item.product as { id?: unknown; price?: unknown } | undefined
  return (
    Boolean(p) &&
    typeof p?.id === 'string' &&
    typeof p?.price === 'number' &&
    typeof item.quantity === 'number'
  )
}

/** Lee y sanea el carrito anónimo desde localStorage. */
export function readAnonCart(): AnonCartItem[] {
  if (typeof window === 'undefined') return []
  const stored = window.localStorage.getItem(ANON_STORAGE_KEY)
  if (!stored) return []
  try {
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(isValidItem) : []
  } catch {
    return []
  }
}

/** Persiste el carrito anónimo en localStorage y espeja la cookie para el merge. */
export function writeAnonCart(items: AnonCartItem[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(items))

  const refs = items.map((it) => ({ productId: it.product.id, quantity: it.quantity }))
  if (refs.length === 0) {
    document.cookie = `${ANON_CART_COOKIE}=; path=/; max-age=0; SameSite=Lax`
    return
  }
  const value = encodeURIComponent(JSON.stringify(refs))
  document.cookie = `${ANON_CART_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

/** Borra por completo el carrito anónimo (tras mergear al loguearse). */
export function clearAnonCart(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ANON_STORAGE_KEY)
  document.cookie = `${ANON_CART_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}
