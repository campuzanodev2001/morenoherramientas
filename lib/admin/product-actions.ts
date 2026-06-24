'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, productImages } from '@/lib/db/schemas'
import { requireRole } from '@/lib/auth/helpers'
import { parseOrThrow } from '@/lib/errors/validation'
import { handleServerActionError, type ServerActionError } from '@/lib/errors/handlers'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { productInputSchema, type ProductInput } from '@/lib/validations/product'
import { slugify } from '@/lib/utils/slug'
import type { ProductParsed } from '@/lib/validations/product'

type ActionOk = { success: true; id: string }
type ActionResult = ActionOk | ServerActionError

/** Mapea violaciones de unicidad de Postgres a errores operacionales claros. */
function mapUniqueError(error: unknown): never {
  const code = (error as { code?: string })?.code
  const constraint = (error as { constraint_name?: string })?.constraint_name ?? ''
  if (code === '23505') {
    if (constraint.includes('sku')) {
      throw new ValidationError([{ field: 'sku', message: 'Ya existe un producto con ese SKU' }])
    }
    if (constraint.includes('slug')) {
      throw new ValidationError([{ field: 'slug', message: 'Ese slug ya está en uso' }])
    }
  }
  throw error
}

async function resolveUniqueSlug(base: string, sku: string, excludeId?: string): Promise<string> {
  let slug = base
  for (let attempt = 0; attempt < 6; attempt++) {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1)
    if (!existing || existing.id === excludeId) return slug
    slug =
      attempt === 0 && sku
        ? `${base}-${slugify(sku)}`
        : `${base}-${Math.random().toString(36).slice(2, 6)}`
  }
  return `${base}-${Date.now().toString(36)}`
}

function normalizeImages(images: ProductParsed['images']) {
  if (images.length === 0) return []
  const primaryIdx = Math.max(0, images.findIndex((img) => img.isPrimary))
  return images.map((img, i) => ({
    url: img.url,
    alt: img.alt || null,
    order: i,
    isPrimary: i === primaryIdx,
  }))
}

function toCents(pesos: number): number {
  return Math.round(pesos * 100)
}

export async function createProductAction(input: ProductInput): Promise<ActionResult> {
  try {
    await requireRole('admin')
    const data = parseOrThrow(productInputSchema, input)

    const desired = data.slug.trim() ? slugify(data.slug) : slugify(data.name)
    const slug = await resolveUniqueSlug(desired, data.sku)
    const active = data.stock <= 0 ? false : data.active

    let id: string
    try {
      const [product] = await db
        .insert(products)
        .values({
          name: data.name,
          slug,
          description: data.description || null,
          price: toCents(data.price),
          compareAtPrice: data.compareAtPrice != null ? toCents(data.compareAtPrice) : null,
          stock: data.stock,
          sku: data.sku || null,
          barcode: data.barcode || null,
          brand: data.brand || null,
          specs: data.specs,
          active,
          categoryId: data.categoryId ?? null,
        })
        .returning({ id: products.id })
      if (!product) throw new Error('insert failed')
      id = product.id
    } catch (e) {
      mapUniqueError(e)
    }

    const imgs = normalizeImages(data.images)
    if (imgs.length > 0) {
      await db.insert(productImages).values(imgs.map((img) => ({ ...img, productId: id })))
    }

    revalidatePath('/admin/productos')
    revalidatePath('/')
    return { success: true, id }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function updateProductAction(id: string, input: ProductInput): Promise<ActionResult> {
  try {
    await requireRole('admin')
    const data = parseOrThrow(productInputSchema, input)

    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1)
    if (!existing) throw new NotFoundError('Producto no encontrado')

    const desired = data.slug.trim() ? slugify(data.slug) : slugify(data.name)
    const slug = await resolveUniqueSlug(desired, data.sku, id)
    const active = data.stock <= 0 ? false : data.active

    try {
      await db
        .update(products)
        .set({
          name: data.name,
          slug,
          description: data.description || null,
          price: toCents(data.price),
          compareAtPrice: data.compareAtPrice != null ? toCents(data.compareAtPrice) : null,
          stock: data.stock,
          sku: data.sku || null,
          barcode: data.barcode || null,
          brand: data.brand || null,
          specs: data.specs,
          active,
          categoryId: data.categoryId ?? null,
        })
        .where(eq(products.id, id))
    } catch (e) {
      mapUniqueError(e)
    }

    // Reemplazar imágenes completas.
    await db.delete(productImages).where(eq(productImages.productId, id))
    const imgs = normalizeImages(data.images)
    if (imgs.length > 0) {
      await db.insert(productImages).values(imgs.map((img) => ({ ...img, productId: id })))
    }

    revalidatePath('/admin/productos')
    revalidatePath('/')
    return { success: true, id }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function setProductActiveAction(
  id: string,
  active: boolean,
): Promise<{ success: true } | ServerActionError> {
  try {
    await requireRole('admin')
    await db.update(products).set({ active }).where(and(eq(products.id, id), isNull(products.deletedAt)))
    revalidatePath('/admin/productos')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function deleteProductAction(
  id: string,
): Promise<{ success: true } | ServerActionError> {
  try {
    await requireRole('admin')
    await db
      .update(products)
      .set({ deletedAt: new Date(), active: false })
      .where(eq(products.id, id))
    revalidatePath('/admin/productos')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}
