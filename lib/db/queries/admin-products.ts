import { and, count, desc, eq, ilike, isNull, or, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, productImages, categories } from '@/lib/db/schemas'
import type { Product, ProductImage } from '@/lib/db/types'

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
  search?: string
  categoryId?: string
  active?: boolean
  page?: number
  limit?: number
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
  return conds
}

export async function listProductsAdmin(filters: AdminProductFilters = {}): Promise<AdminProductPage> {
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100)
  const page = Math.max(filters.page ?? 1, 1)
  const offset = (page - 1) * limit
  const conds = buildConds(filters)

  const [{ total }] = await db
    .select({ total: count() })
    .from(products)
    .where(and(...conds))

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
    .orderBy(desc(products.createdAt), desc(products.id))
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
