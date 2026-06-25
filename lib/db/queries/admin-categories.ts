import { asc, count, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, products } from '@/lib/db/schemas'
import type { Category } from '@/lib/db/types'

export type FlatCategory = Category & { depth: number }

/** Todas las categorías (activas e inactivas) aplanadas con profundidad, para
 *  selects del admin y la vista de árbol. */
export async function listCategoriesFlat(): Promise<FlatCategory[]> {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.order), asc(categories.name))

  const childrenByParent = new Map<string | null, Category[]>()
  for (const row of rows) {
    const key = row.parentId ?? null
    const list = childrenByParent.get(key) ?? []
    list.push(row)
    childrenByParent.set(key, list)
  }

  const out: FlatCategory[] = []
  const walk = (parentId: string | null, depth: number) => {
    for (const cat of childrenByParent.get(parentId) ?? []) {
      out.push({ ...cat, depth })
      walk(cat.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
}

export type CategoryWithCount = FlatCategory & { productCount: number }

export async function listCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const flat = await listCategoriesFlat()
  const rows = await db
    .select({ categoryId: products.categoryId, c: count() })
    .from(products)
    .where(isNull(products.deletedAt))
    .groupBy(products.categoryId)
  const map = new Map(rows.map((r) => [r.categoryId, r.c]))
  return flat.map((c) => ({ ...c, productCount: map.get(c.id) ?? 0 }))
}

export async function getCategoryProductCount(categoryId: string): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(products)
    .where(eq(products.categoryId, categoryId))
  return row?.c ?? 0
}

export async function isRootCategory(categoryId: string): Promise<boolean> {
  const [row] = await db
    .select({ parentId: categories.parentId })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1)
  return Boolean(row) && row?.parentId == null
}
