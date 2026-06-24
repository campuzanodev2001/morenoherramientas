import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schemas'
import type { Category } from '@/lib/db/types'

export type CategoryNode = Category & { children: CategoryNode[] }

/** Árbol completo de categorías activas, ordenado por `order`. */
export async function getCategories(): Promise<CategoryNode[]> {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.active, true))
    .orderBy(asc(categories.order), asc(categories.name))

  const byId = new Map<string, CategoryNode>()
  for (const row of rows) byId.set(row.id, { ...row, children: [] })

  const roots: CategoryNode[] = []
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export type CategoryWithChildren = Category & { children: Category[] }

/** Categoría por slug con sus hijos directos. Null si no existe o está inactiva. */
export async function getCategoryBySlug(slug: string): Promise<CategoryWithChildren | null> {
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.active, true)))
    .limit(1)

  if (!category) return null

  const children = await db
    .select()
    .from(categories)
    .where(and(eq(categories.parentId, category.id), eq(categories.active, true)))
    .orderBy(asc(categories.order), asc(categories.name))

  return { ...category, children }
}
