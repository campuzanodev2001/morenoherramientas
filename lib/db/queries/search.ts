import { and, count, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, categories } from '@/lib/db/schemas'
import type { Product } from '@/lib/db/types'

export type SearchParams = {
  q: string
  categorySlug?: string
  priceMin?: number // pesos
  priceMax?: number // pesos
  offset?: number
  limit?: number
}

export type SearchResult = {
  products: Product[]
  total: number
  nextOffset: number | null
}

/**
 * Búsqueda fuzzy con pg_trgm: usa el operador `%` (similaridad por trigramas,
 * acelerado por el índice GIN) con fallback a ILIKE, ordenando por similaridad.
 */
export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const q = params.q.trim()
  if (!q) return { products: [], total: 0, nextOffset: null }

  const limit = Math.min(Math.max(params.limit ?? 24, 1), 60)
  const offset = Math.max(params.offset ?? 0, 0)
  const like = `%${q}%`

  const conds = [
    eq(products.active, true),
    isNull(products.deletedAt),
    sql`(${products.name} % ${q} OR ${products.name} ILIKE ${like} OR coalesce(${products.brand}, '') % ${q})`,
  ]
  if (params.categorySlug) conds.push(eq(categories.slug, params.categorySlug))
  if (typeof params.priceMin === 'number') conds.push(gte(products.price, params.priceMin * 100))
  if (typeof params.priceMax === 'number') conds.push(lte(products.price, params.priceMax * 100))

  const where = and(...conds)
  const similarity = sql<number>`similarity(${products.name}, ${q})`

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({ product: products })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(desc(similarity), desc(products.createdAt))
      .limit(limit + 1)
      .offset(offset),
    db
      .select({ c: count() })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where),
  ])

  const hasMore = rows.length > limit
  const page = (hasMore ? rows.slice(0, limit) : rows).map((r) => r.product)
  return {
    products: page,
    total: totalRow?.c ?? 0,
    nextOffset: hasMore ? offset + limit : null,
  }
}
