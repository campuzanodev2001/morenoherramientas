import { and, desc, eq, getTableColumns, ilike, isNull, or, sql } from 'drizzle-orm'
import { db, type DbOrTx } from '@/lib/db'
import { products, productImages, categories } from '@/lib/db/schemas'
import type { Product, ProductImage, Category } from '@/lib/db/types'
import {
  encodeCursor,
  decodeCursor,
  cursorCondition,
} from './_cursor'

const MAX_LIMIT = 60
const DEFAULT_LIMIT = 24

/** Filtro base de visibilidad pública: activo y no borrado. */
function visibleConds() {
  return [eq(products.active, true), isNull(products.deletedAt)]
}

export type GetProductsParams = {
  categorySlug?: string
  search?: string
  cursor?: string | null
  limit?: number
}

export type ProductList = {
  products: Product[]
  nextCursor: string | null
}

/**
 * Listado público paginado por cursor. Siempre filtra active = true AND
 * deletedAt IS NULL. La búsqueda acá es por prefijo (ILIKE); la búsqueda fuzzy
 * con pg_trgm vive en el endpoint /api/productos/buscar (SEARCH-01).
 */
export async function getProducts(params: GetProductsParams = {}): Promise<ProductList> {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)
  const conds = visibleConds()

  if (params.categorySlug) {
    conds.push(eq(categories.slug, params.categorySlug))
  }
  if (params.search && params.search.trim()) {
    const q = `%${params.search.trim()}%`
    const match = or(
      ilike(products.name, q),
      ilike(products.brand, q),
      ilike(products.sku, q),
    )
    if (match) conds.push(match)
  }
  const cursor = decodeCursor(params.cursor)
  if (cursor) {
    const c = cursorCondition(products.createdAt, products.id, cursor)
    if (c) conds.push(c)
  }

  const rows = await db
    .select(getTableColumns(products))
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conds))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const last = page.at(-1)
  const nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null

  return { products: page, nextCursor }
}

export type ProductWithRelations = Product & {
  images: ProductImage[]
  category: Category | null
}

/** Ficha de producto con imágenes y categoría. Null si no existe o no es visible. */
export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), ...visibleConds()))
    .limit(1)

  if (!product) return null

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(desc(productImages.isPrimary), productImages.order)

  let category: Category | null = null
  if (product.categoryId) {
    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, product.categoryId))
      .limit(1)
    category = cat ?? null
  }

  return { ...product, images, category }
}

/** Productos destacados: los más recientes activos. */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(and(...visibleConds()))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(Math.min(limit, MAX_LIMIT))
}

/**
 * Descuenta stock dentro de una transacción (se le pasa el `tx` del webhook).
 * Si el stock llega a 0 o menos, desactiva el producto automáticamente.
 */
export async function decrementStock(
  productId: string,
  quantity: number,
  executor: DbOrTx = db,
): Promise<void> {
  await executor
    .update(products)
    .set({
      stock: sql`${products.stock} - ${quantity}`,
      active: sql`case when ${products.stock} - ${quantity} <= 0 then false else ${products.active} end`,
    })
    .where(eq(products.id, productId))
}
