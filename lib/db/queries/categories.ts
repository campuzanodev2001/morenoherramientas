import { and, asc, count, eq, gt, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, products } from '@/lib/db/schemas'
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

export type StoreCategory = {
  id: string
  slug: string
  name: string
  /** Productos publicables con stock, propios + de toda la descendencia. */
  productCount: number
  children: StoreCategory[]
}

/** Productos con stock por categoría directa. */
async function stockCountByCategory(): Promise<Map<string, number>> {
  const rows = await db
    .select({ categoryId: products.categoryId, total: count() })
    .from(products)
    .where(and(eq(products.active, true), isNull(products.deletedAt), gt(products.stock, 0)))
    .groupBy(products.categoryId)

  const map = new Map<string, number>()
  for (const row of rows) if (row.categoryId) map.set(row.categoryId, row.total)
  return map
}

/**
 * Árbol de categorías para la tienda: solo las que tienen al menos un producto
 * con stock, propio o de alguna subcategoría. Una categoría sin stock no se
 * muestra aunque esté activa — el comprador no debe entrar a una lista vacía.
 */
export async function getStoreCategories(): Promise<StoreCategory[]> {
  const [tree, counts] = await Promise.all([getCategories(), stockCountByCategory()])

  function prune(node: CategoryNode): StoreCategory | null {
    const children = node.children
      .map(prune)
      .filter((c): c is StoreCategory => c !== null)
    const productCount =
      (counts.get(node.id) ?? 0) + children.reduce((sum, c) => sum + c.productCount, 0)
    if (productCount === 0) return null
    return { id: node.id, slug: node.slug, name: node.name, productCount, children }
  }

  return tree.map(prune).filter((c): c is StoreCategory => c !== null)
}

/** La categoría y toda su descendencia. Vacío si el slug no existe. */
export async function getCategoryBranchIds(slug: string): Promise<string[]> {
  const rows = await db
    .select({ id: categories.id, slug: categories.slug, parentId: categories.parentId })
    .from(categories)
    .where(eq(categories.active, true))

  const root = rows.find((r) => r.slug === slug)
  if (!root) return []

  const childrenOf = new Map<string, string[]>()
  for (const row of rows) {
    if (!row.parentId) continue
    const siblings = childrenOf.get(row.parentId) ?? []
    siblings.push(row.id)
    childrenOf.set(row.parentId, siblings)
  }

  const ids: string[] = []
  const pending = [root.id]
  while (pending.length > 0) {
    const id = pending.pop()!
    if (ids.includes(id)) continue // ciclo defensivo: parentId es autorreferencial
    ids.push(id)
    pending.push(...(childrenOf.get(id) ?? []))
  }
  return ids
}
