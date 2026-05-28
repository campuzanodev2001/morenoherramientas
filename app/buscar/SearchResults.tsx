'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { searchProducts } from '@/lib/search'
import type { Product } from '@/lib/products'

type SortField = 'fecha' | 'precio' | 'nombre'
type SortDirection = 'asc' | 'desc'

interface SearchResultsProps {
  query: string
  products: Product[]
}

function parsePriceValue(price: string): number {
  return Number(price.replace(/[^0-9]/g, ''))
}

function sortResults(results: Product[], field: SortField, direction: SortDirection): Product[] {
  const sorted = [...results].sort((a, b) => {
    if (field === 'nombre') {
      return a.name.localeCompare(b.name, 'es')
    }
    if (field === 'precio') {
      return parsePriceValue(a.price) - parsePriceValue(b.price)
    }
    return a.id - b.id
  })
  return direction === 'desc' ? sorted.reverse() : sorted
}

export default function SearchResults({ query, products }: SearchResultsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('fecha')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [query])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-5 w-52 bg-surface-container animate-pulse rounded-none" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-charcoal animate-pulse rounded-none">
              <div className="aspect-square bg-surface-container rounded-none" />
              <div className="p-3 flex flex-col gap-2">
                <div className="h-2.5 w-16 bg-surface-container rounded-none" />
                <div className="h-4 w-full bg-surface-container rounded-none" />
                <div className="h-4 w-3/4 bg-surface-container rounded-none" />
                <div className="h-6 w-20 bg-surface-container rounded-none mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <span className="material-symbols-outlined text-6xl text-outline">search</span>
        <h2 className="text-2xl font-black uppercase text-on-surface">
          Ingresá un término de búsqueda
        </h2>
        <p className="text-on-surface-variant font-medium max-w-sm">
          Usá la barra de búsqueda para encontrar herramientas, repuestos y equipamiento.
        </p>
      </div>
    )
  }

  const rawResults = searchProducts(query, products)

  if (rawResults.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <span className="material-symbols-outlined text-6xl text-outline">search_off</span>
        <h2 className="text-2xl font-black uppercase text-on-surface">
          No encontramos resultados para &quot;{query}&quot;
        </h2>
        <p className="text-on-surface-variant font-medium max-w-sm">
          Intentá con otros términos o navegá nuestras categorías desde el menú.
        </p>
        <Link
          href="/"
          className="bg-accent-red text-on-primary font-black uppercase tracking-widest py-4 px-8 text-sm flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] rounded-none"
        >
          <span className="material-symbols-outlined">home</span>
          Volver al inicio
        </Link>
      </div>
    )
  }

  const results = sortResults(rawResults, sortField, sortDirection)

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'fecha', label: 'Fecha' },
    { field: 'precio', label: 'Precio' },
    { field: 'nombre', label: 'Nombre' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
          <span className="text-accent-red font-black text-base">{results.length}</span>
          {' '}resultado{results.length !== 1 ? 's' : ''} para &apos;{query}&apos;
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            Ordenar por
          </span>
          <div className="flex items-center gap-1">
            {sortOptions.map(({ field, label }) => (
              <button
                key={field}
                onClick={() => {
                  if (sortField === field) {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortField(field)
                    setSortDirection('asc')
                  }
                }}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all duration-150 flex items-center gap-1 rounded-none ${
                  sortField === field
                    ? 'border-accent-red text-accent-red bg-charcoal'
                    : 'border-transparent text-on-surface-variant bg-charcoal hover:text-on-surface'
                }`}
              >
                {label}
                {sortField === field && (
                  <span className="material-symbols-outlined text-xs leading-none">
                    {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {results.map((product) => (
          <Link
            key={product.id}
            href={`/producto/${product.id}`}
            className="flex flex-col bg-charcoal group border-b-4 border-transparent hover:border-accent-red transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] rounded-none"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
            <div className="p-3 flex flex-col gap-1 flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-primary/60">
                {product.subcategory || product.category}
              </span>
              <span className="text-xs font-black uppercase leading-tight text-on-primary line-clamp-2">
                {product.name}
              </span>
              <span className="text-accent-red text-lg font-black leading-none mt-auto pt-2">
                {product.price}
              </span>
            </div>
            <div className="px-3 pb-3">
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-on-primary/60 group-hover:text-accent-red transition-colors duration-200">
                Ver producto
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
