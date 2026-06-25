'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from './context/CartContext'
import CartDrawer from './components/CartDrawer'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </SessionProvider>
  )
}
