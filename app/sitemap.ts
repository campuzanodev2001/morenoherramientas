import type { MetadataRoute } from 'next'
import { and, eq, isNull, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schemas'
import { getStoreCategories, type StoreCategory } from '@/lib/db/queries/categories'
import { env } from '@/lib/env'
import { safe } from '@/lib/db/safe'

// Límite de Google: 50.000 URLs por sitemap.
const MAX_URLS = 50_000
const MAX_PRODUCTS = MAX_URLS - 1000

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

  const [cats, prods] = await Promise.all([
    // Solo categorías con stock: no tiene sentido indexar listados vacíos.
    safe(() => getStoreCategories(), []),
    safe(
      () =>
        db
          .select({ slug: products.slug, updatedAt: products.updatedAt })
          .from(products)
          .where(and(eq(products.active, true), isNull(products.deletedAt)))
          .orderBy(desc(products.updatedAt))
          .limit(MAX_PRODUCTS),
      [],
    ),
  ])

  const home: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/categorias`, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const flatten = (nodes: StoreCategory[]): StoreCategory[] =>
    nodes.flatMap((n) => [n, ...flatten(n.children)])

  const categoryUrls: MetadataRoute.Sitemap = flatten(cats).map((c) => ({
    url: `${base}/categoria/${c.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const productUrls: MetadataRoute.Sitemap = prods.map((p) => ({
    url: `${base}/producto/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...home, ...categoryUrls, ...productUrls].slice(0, MAX_URLS)
}
