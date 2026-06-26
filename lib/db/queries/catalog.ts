import { and, desc, eq, inArray, isNull, ne, count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, productImages, categories } from '@/lib/db/schemas'
import type { Product } from '@/lib/db/types'

export type ProductCard = {
  id: string
  slug: string
  name: string
  brand: string | null
  price: number // centavos
  compareAtPrice: number | null
  stock: number
  imageUrl: string | null
}

const visible = () => [eq(products.active, true), isNull(products.deletedAt)]

async function primaryImageMap(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (ids.length === 0) return map
  const imgs = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .where(inArray(productImages.productId, ids))
    .orderBy(desc(productImages.isPrimary), productImages.order)
  for (const img of imgs) if (!map.has(img.productId)) map.set(img.productId, img.url)
  return map
}

function toCard(p: Product, imageUrl: string | null): ProductCard {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    imageUrl,
  }
}

async function toCards(rows: Product[]): Promise<ProductCard[]> {
  const images = await primaryImageMap(rows.map((r) => r.id))
  return rows.map((r) => toCard(r, images.get(r.id) ?? null))
}

export async function getFeaturedCards(limit = 8): Promise<ProductCard[]> {
  const rows = await db
    .select()
    .from(products)
    .where(and(...visible()))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit)
  return toCards(rows)
}

/** Tarjetas para una lista de ids, preservando el orden recibido. */
export async function getCardsByIds(ids: string[]): Promise<ProductCard[]> {
  if (ids.length === 0) return []
  const rows = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, ids), ...visible()))
  const cards = await toCards(rows)
  const byId = new Map(cards.map((c) => [c.id, c]))
  return ids.map((id) => byId.get(id)).filter((c): c is ProductCard => Boolean(c))
}

export type CategoryProductsPage = {
  cards: ProductCard[]
  total: number
  totalPages: number
}

export async function getCategoryCards(
  categorySlug: string,
  page = 1,
  limit = 24,
): Promise<CategoryProductsPage> {
  const offset = (Math.max(page, 1) - 1) * limit
  const conds = [...visible(), eq(categories.slug, categorySlug)]

  const [totalRow] = await db
    .select({ total: count() })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conds))
  const total = totalRow?.total ?? 0

  const rows = await db
    .select({ product: products })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conds))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit)
    .offset(offset)

  const cards = await toCards(rows.map((r) => r.product))
  return { cards, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}

export async function getRelatedCards(
  categoryId: string | null,
  excludeId: string,
  limit = 5,
): Promise<ProductCard[]> {
  if (!categoryId) return []
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, categoryId), ne(products.id, excludeId), ...visible()))
    .orderBy(desc(products.createdAt))
    .limit(limit)
  return toCards(rows)
}

/** Slugs de los productos más recientes, para generateStaticParams. */
export async function getRecentProductSlugs(limit = 200): Promise<string[]> {
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(and(...visible()))
    .orderBy(desc(products.createdAt))
    .limit(limit)
  return rows.map((r) => r.slug)
}
