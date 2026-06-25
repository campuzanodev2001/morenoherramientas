'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schemas'
import { requireRole } from '@/lib/auth/helpers'
import { parseOrThrow } from '@/lib/errors/validation'
import { handleServerActionError, type ServerActionError } from '@/lib/errors/handlers'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { categoryInputSchema, type CategoryInput } from '@/lib/validations/category'
import { slugify } from '@/lib/utils/slug'
import { getCategoryProductCount, isRootCategory } from '@/lib/db/queries/admin-categories'

type Result = { success: true; id: string } | ServerActionError

async function uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  let slug = base
  for (let i = 0; i < 6; i++) {
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1)
    if (!existing || existing.id === excludeId) return slug
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
  }
  return `${base}-${Date.now().toString(36)}`
}

/** Valida la regla de máximo 2 niveles: el padre debe ser una categoría raíz. */
async function assertParentIsRoot(parentId: string | null | undefined) {
  if (!parentId) return
  const ok = await isRootCategory(parentId)
  if (!ok) {
    throw new ValidationError([
      { field: 'parentId', message: 'Solo se permiten 2 niveles de categorías' },
    ])
  }
}

function revalidate() {
  revalidatePath('/admin/categorias')
  revalidatePath('/')
  revalidatePath('/categorias')
}

export async function createCategoryAction(input: CategoryInput): Promise<Result> {
  try {
    await requireRole('admin')
    const data = parseOrThrow(categoryInputSchema, input)
    await assertParentIsRoot(data.parentId)
    const slug = await uniqueCategorySlug(data.slug.trim() ? slugify(data.slug) : slugify(data.name))

    const [created] = await db
      .insert(categories)
      .values({
        name: data.name,
        slug,
        parentId: data.parentId ?? null,
        order: data.order,
        active: data.active,
      })
      .returning({ id: categories.id })
    if (!created) throw new Error('insert failed')

    revalidate()
    return { success: true, id: created.id }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function updateCategoryAction(id: string, input: CategoryInput): Promise<Result> {
  try {
    await requireRole('admin')
    const data = parseOrThrow(categoryInputSchema, input)

    const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    if (!existing) throw new NotFoundError('Categoría no encontrada')

    if (data.parentId === id) {
      throw new ValidationError([{ field: 'parentId', message: 'Una categoría no puede ser su propio padre' }])
    }
    await assertParentIsRoot(data.parentId)

    const slug = await uniqueCategorySlug(data.slug.trim() ? slugify(data.slug) : slugify(data.name), id)
    await db
      .update(categories)
      .set({
        name: data.name,
        slug,
        parentId: data.parentId ?? null,
        order: data.order,
        active: data.active,
      })
      .where(eq(categories.id, id))

    revalidate()
    return { success: true, id }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function deleteCategoryAction(id: string): Promise<{ success: true } | ServerActionError> {
  try {
    await requireRole('admin')

    const productCount = await getCategoryProductCount(id)
    if (productCount > 0) {
      throw new ValidationError([
        { field: 'category', message: `No se puede borrar: tiene ${productCount} producto(s) asignado(s)` },
      ])
    }
    const [child] = await db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, id)).limit(1)
    if (child) {
      throw new ValidationError([{ field: 'category', message: 'No se puede borrar: tiene subcategorías' }])
    }

    await db.delete(categories).where(eq(categories.id, id))
    revalidate()
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}
