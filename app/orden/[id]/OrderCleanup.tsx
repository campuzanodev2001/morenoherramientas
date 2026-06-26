'use client'

import { useEffect } from 'react'

/**
 * Tras un pago exitoso: limpia el sessionStorage del checkout y usa
 * replaceState para que el botón "atrás" no vuelva al checkout.
 */
export default function OrderCleanup({ confirmed }: { confirmed: boolean }) {
  useEffect(() => {
    if (!confirmed) return
    try {
      sessionStorage.removeItem('checkout')
    } catch {
      // ignore
    }
    window.history.replaceState(null, '', window.location.pathname)
  }, [confirmed])

  return null
}
