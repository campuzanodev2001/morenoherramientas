'use client'

import { createContext, useContext } from 'react'
import type { StoreCategory } from '@/lib/db/queries/categories'

const CategoriesContext = createContext<StoreCategory[]>([])

export function CategoriesProvider({
  categories,
  children,
}: {
  categories: StoreCategory[]
  children: React.ReactNode
}) {
  return <CategoriesContext.Provider value={categories}>{children}</CategoriesContext.Provider>
}

/**
 * Categorías con stock, cargadas una sola vez en el layout raíz. Existe como
 * contexto porque el menú lo consumen páginas cliente (carrito) que no pueden
 * recibirlas por props desde el servidor.
 */
export function useCategories(): StoreCategory[] {
  return useContext(CategoriesContext)
}
