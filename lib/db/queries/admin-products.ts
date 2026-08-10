import { and, asc, count, desc, eq, ilike, isNull, or, inArray } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db'
import { products, productImages, categories } from '@/lib/db/schemas'
import type { Product, ProductImage } from '@/lib/db/types'

/**
 * Columnas por las que se puede ordenar el listado de admin. Es una whitelist:
 * el valor llega por querystring y nunca se interpola en el SQL.
 */
const SORT_COLUMNS = {
  name: products.name,
  category: categories.name,
  price: products.price,
  stock: products.stock,
  active: products.active,
  created: products.createdAt,
} satisfies Record<string, PgColumn>

export type ProductSortKey = keyof typeof SORT_COLUMNS
export type SortDirection = 'asc' | 'desc'

export const DEFAULT_PRODUCT_SORT: ProductSortKey = 'created'
export const DEFAULT_PRODUCT_DIR: SortDirection = 'desc'

export function isProductSortKey(value: string): value is ProductSortKey {
  return value in SORT_COLUMNS
}

export function isSortDirection(value: string): value is SortDirection {
  return value === 'asc' || value === 'desc'
}

export type AdminProductRow = {
  id: string
  name: string
  sku: string | null
  brand: string | null
  price: number
  stock: number
  active: boolean
  categoryName: string | null
  primaryImageUrl: string | null
}

export type AdminProductFilters = {
  search?: string | undefined
  categoryId?: string | undefined
  active?: boolean | undefined
  /** true → solo productos con stock 0. */
  outOfStock?: boolean | undefined
  page?: number | undefined
  limit?: number | undefined
  sort?: ProductSortKey | undefined
  dir?: SortDirection | undefined
}

export type AdminProductPage = {
  rows: AdminProductRow[]
  total: number
  page: number
  totalPages: number
}

function buildConds(filters: AdminProductFilters) {
  // Admin ve activos e inactivos, pero NO los borrados (soft delete).
  const conds = [isNull(products.deletedAt)]
  if (filters.search && filters.search.trim()) {
    const q = `%${filters.search.trim()}%`
    const m = or(ilike(products.name, q), ilike(products.sku, q), ilike(products.brand, q))
    if (m) conds.push(m)
  }
  if (filters.categoryId) conds.push(eq(products.categoryId, filters.categoryId))
  if (typeof filters.active === 'boolean') conds.push(eq(products.active, filters.active))
  if (filters.outOfStock) conds.push(eq(products.stock, 0))
  return conds
}

export async function listProductsAdmin(filters: AdminProductFilters = {}): Promise<AdminProductPage> {
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100)
  const page = Math.max(filters.page ?? 1, 1)
  const offset = (page - 1) * limit
  const conds = buildConds(filters)

  const [totalRow] = await db
    .select({ total: count() })
    .from(products)
    .where(and(...conds))
  const total = totalRow?.total ?? 0

  const sortColumn = SORT_COLUMNS[filters.sort ?? DEFAULT_PRODUCT_SORT]
  const direction = (filters.dir ?? DEFAULT_PRODUCT_DIR) === 'asc' ? asc : desc

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      brand: products.brand,
      price: products.price,
      stock: products.stock,
      active: products.active,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conds))
    // El id desempata: sin él, filas con el mismo valor pueden repetirse o
    // desaparecer entre páginas (el orden no es estable en Postgres).
    .orderBy(direction(sortColumn), desc(products.id))
    .limit(limit)
    .offset(offset)

  const ids = rows.map((r) => r.id)
  const primaryByProduct = new Map<string, string>()
  if (ids.length > 0) {
    const imgs = await db
      .select({ productId: productImages.productId, url: productImages.url, isPrimary: productImages.isPrimary, order: productImages.order })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(desc(productImages.isPrimary), productImages.order)
    for (const img of imgs) {
      if (!primaryByProduct.has(img.productId)) primaryByProduct.set(img.productId, img.url)
    }
  }

  return {
    rows: rows.map((r) => ({ ...r, primaryImageUrl: primaryByProduct.get(r.id) ?? null })),
    total: total ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((total ?? 0) / limit)),
  }
}

export type AdminProductDetail = Product & { images: ProductImage[] }

/** Producto por id para el formulario de admin (incluye inactivos, no borrados). */
export async function getProductForAdmin(id: string): Promise<AdminProductDetail | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .limit(1)
  if (!product) return null

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(desc(productImages.isPrimary), productImages.order)

  return { ...product, images }
}

/** Métricas del dashboard de admin. */
export async function getAdminProductStats(): Promise<{
  total: number
  active: number
  inactive: number
  outOfStock: number
}> {
  const notDeleted = isNull(products.deletedAt)
  const [[totalRow], [activeRow], [outRow]] = await Promise.all([
    db.select({ c: count() }).from(products).where(notDeleted),
    db.select({ c: count() }).from(products).where(and(notDeleted, eq(products.active, true))),
    db.select({ c: count() }).from(products).where(and(notDeleted, eq(products.stock, 0))),
  ])
  const total = totalRow?.c ?? 0
  const active = activeRow?.c ?? 0
  return { total, active, inactive: total - active, outOfStock: outRow?.c ?? 0 }
}

export type ProductOption = { id: string; name: string; sku: string | null }

const OPTION_COLUMNS = { id: products.id, name: products.name, sku: products.sku }

/**
 * Buscador de productos para armar secciones de la home. El catálogo tiene
 * ~1700 productos: filtrar en el cliente sobre una página traída de antemano
 * dejaba fuera casi todo, así que la búsqueda va contra la DB.
 */
export async function searchProductOptions(search: string, limit = 30): Promise<ProductOption[]> {
  const conds = [isNull(products.deletedAt), eq(products.active, true)]
  const q = search.trim()
  if (q) {
    const m = or(ilike(products.name, `%${q}%`), ilike(products.sku, `%${q}%`), ilike(products.brand, `%${q}%`))
    if (m) conds.push(m)
  }
  return db
    .select(OPTION_COLUMNS)
    .from(products)
    .where(and(...conds))
    .orderBy(asc(products.name))
    .limit(Math.min(Math.max(limit, 1), 50))
}

/** Nombres de los productos ya elegidos, para mostrarlos sin depender del buscador. */
export async function getProductOptionsByIds(ids: string[]): Promise<ProductOption[]> {
  if (ids.length === 0) return []
  return db.select(OPTION_COLUMNS).from(products).where(inArray(products.id, ids))
}
