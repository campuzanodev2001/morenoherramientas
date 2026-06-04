'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Product } from '@/lib/products'
import { products as staticProducts } from '@/lib/products'

type ProductOverride = Partial<Omit<Product, 'id'>> & { id: number }

export type HeroConfig = {
  imageUrl: string
  title: string
  ctaText: string
}

export type SectionsConfig = {
  featuredTitle: string
  featuredProductIds: number[]
}

type AdminConfig = {
  productOverrides: ProductOverride[]
  newProducts: Product[]
  hiddenIds: number[]
  hero: HeroConfig
  sections: SectionsConfig
}

type AdminContextType = {
  allProducts: Product[]
  config: AdminConfig
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: number, data: Partial<Omit<Product, 'id'>>) => void
  deleteProduct: (id: number) => void
  updateHero: (hero: HeroConfig) => void
  updateSections: (sections: SectionsConfig) => void
}

const defaultConfig: AdminConfig = {
  productOverrides: [],
  newProducts: [],
  hiddenIds: [],
  hero: {
    imageUrl:
      'https://images.stockcake.com/public/7/a/4/7a4cb2d3-446b-436b-80c8-7c3bd836f274_large/vintage-garage-workshop-stockcake.jpg',
    title: 'Todo para tu taller en un solo lugar',
    ctaText: 'Buscar productos',
  },
  sections: {
    featuredTitle: 'Productos destacados',
    featuredProductIds: [],
  },
}

const AdminContext = createContext<AdminContextType | null>(null)
const STORAGE_KEY = 'admin_config'

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AdminConfig>(defaultConfig)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setConfig({
          ...defaultConfig,
          ...parsed,
          hero: { ...defaultConfig.hero, ...parsed.hero },
          sections: { ...defaultConfig.sections, ...parsed.sections },
        })
      } catch {
        // ignore corrupted storage
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    }
  }, [config, hydrated])

  const allProducts: Product[] = [
    ...staticProducts
      .filter((p) => !config.hiddenIds.includes(p.id))
      .map((p) => {
        const override = config.productOverrides.find((o) => o.id === p.id)
        return override ? { ...p, ...override } : p
      }),
    ...config.newProducts.filter((p) => !config.hiddenIds.includes(p.id)),
  ]

  function nextId(): number {
    const allIds = [
      ...staticProducts.map((p) => p.id),
      ...config.newProducts.map((p) => p.id),
    ]
    return Math.max(...allIds, 1000) + 1
  }

  function addProduct(data: Omit<Product, 'id'>) {
    const product: Product = { ...data, id: nextId() }
    setConfig((prev) => ({ ...prev, newProducts: [...prev.newProducts, product] }))
  }

  function updateProduct(id: number, data: Partial<Omit<Product, 'id'>>) {
    const isStatic = staticProducts.some((p) => p.id === id)
    if (isStatic) {
      setConfig((prev) => {
        const exists = prev.productOverrides.some((o) => o.id === id)
        return {
          ...prev,
          productOverrides: exists
            ? prev.productOverrides.map((o) => (o.id === id ? { ...o, ...data } : o))
            : [...prev.productOverrides, { id, ...data }],
        }
      })
    } else {
      setConfig((prev) => ({
        ...prev,
        newProducts: prev.newProducts.map((p) => (p.id === id ? { ...p, ...data } : p)),
      }))
    }
  }

  function deleteProduct(id: number) {
    setConfig((prev) => ({
      ...prev,
      hiddenIds: [...new Set([...prev.hiddenIds, id])],
      newProducts: prev.newProducts.filter((p) => p.id !== id),
      productOverrides: prev.productOverrides.filter((o) => o.id !== id),
      sections: {
        ...prev.sections,
        featuredProductIds: prev.sections.featuredProductIds.filter((fId) => fId !== id),
      },
    }))
  }

  function updateHero(hero: HeroConfig) {
    setConfig((prev) => ({ ...prev, hero }))
  }

  function updateSections(sections: SectionsConfig) {
    setConfig((prev) => ({ ...prev, sections }))
  }

  return (
    <AdminContext.Provider
      value={{
        allProducts,
        config,
        addProduct,
        updateProduct,
        deleteProduct,
        updateHero,
        updateSections,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used within AdminProvider')
  return context
}
