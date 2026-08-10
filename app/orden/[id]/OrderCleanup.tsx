'use client'

import { useEffect, useRef } from 'react'
import { useCart } from '@/app/context/CartContext'

/**
 * Cierre del checkout al volver de MercadoPago.
 *
 * `settled` es true cuando la orden ya existe y el pago no fue rechazado
 * (confirmada o pendiente de acreditación): recién ahí se vacía el carrito.
 * Si el pago se rechazó, el carrito se conserva para poder reintentar.
 */
export default function OrderCleanup({ settled }: { settled: boolean }) {
  const { clearCart } = useCart()
  const done = useRef(false)

  useEffect(() => {
    if (!settled || done.current) return
    done.current = true
    try {
      sessionStorage.removeItem('checkout')
    } catch {
      // ignore
    }
    clearCart()
    // replaceState para que "atrás" no vuelva al checkout.
    window.history.replaceState(null, '', window.location.pathname)
  }, [settled, clearCart])

  return null
}
