import { asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schemas'
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
