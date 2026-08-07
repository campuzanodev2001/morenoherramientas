'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from './context/CartContext'
import { CategoriesProvider } from './context/CategoriesContext'
import CartDrawer from './components/CartDrawer'
import type { StoreCategory } from '@/lib/db/queries/categories'

export default function Providers({
  categories,
  children,
}: {
  categories: StoreCategory[]
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <CategoriesProvider categories={categories}>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </CategoriesProvider>
    </SessionProvider>
  )
}
