'use server'

import { randomUUID } from 'crypto'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/helpers'
import { parseOrThrow } from '@/lib/errors/validation'
import { handleServerActionError, type ServerActionError } from '@/lib/errors/handlers'
import { getHomeConfig, setHomeConfig, type HomeSection } from '@/lib/db/queries/store-settings'
import { searchProductOptions, type ProductOption } from '@/lib/db/queries/admin-products'

// La imagen del hero la reemplazaron los banners: el hero es solo texto.
const heroSchema = z.object({
  title: z.string().min(1, 'Ingresá el título'),
  ctaText: z.string().min(1, 'Ingresá el texto del botón'),
})

const sectionSchema = z.object({
  // Vacío al crear: el id lo genera el servidor.
  id: z.string().optional(),
  title: z.string().min(1, 'Ingresá el título de la sección'),
  productIds: z.array(z.string().uuid()).default([]),
  active: z.boolean().default(true),
})

type Ok = { success: true }

const ADMIN_SECTIONS_PATH = '/admin/secciones'

function revalidateHome(): void {
  revalidatePath('/')
  revalidatePath(ADMIN_SECTIONS_PATH)
}

export async function updateHeroAction(input: unknown): Promise<Ok | ServerActionError> {
  try {
    await requireRole('admin')
    const hero = parseOrThrow(heroSchema, input)
    const config = await getHomeConfig()
    await setHomeConfig({ ...config, hero })
    revalidatePath('/')
    revalidatePath('/admin/home')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

/** Crea una sección nueva o actualiza la existente, según venga o no `id`. */
export async function saveSectionAction(input: unknown): Promise<Ok | ServerActionError> {
  try {
    await requireRole('admin')
    const data = parseOrThrow(sectionSchema, input)
    const config = await getHomeConfig()

    const section: HomeSection = {
      id: data.id ?? randomUUID(),
      title: data.title,
      productIds: data.productIds,
      active: data.active,
    }

    const index = config.sections.findIndex((s) => s.id === section.id)
    const sections =
      index === -1
        ? [...config.sections, section]
        : config.sections.map((s) => (s.id === section.id ? section : s))

    await setHomeConfig({ ...config, sections })
    revalidateHome()
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function deleteSectionAction(input: unknown): Promise<Ok | ServerActionError> {
  try {
    await requireRole('admin')
    const { id } = parseOrThrow(z.object({ id: z.string().min(1) }), input)
    const config = await getHomeConfig()
    await setHomeConfig({ ...config, sections: config.sections.filter((s) => s.id !== id) })
    revalidateHome()
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

/** Mueve una sección un lugar arriba o abajo; el orden del array es el de la home. */
export async function moveSectionAction(input: unknown): Promise<Ok | ServerActionError> {
  try {
    await requireRole('admin')
    const { id, direction } = parseOrThrow(
      z.object({ id: z.string().min(1), direction: z.enum(['up', 'down']) }),
      input,
    )
    const config = await getHomeConfig()
    const index = config.sections.findIndex((s) => s.id === id)
    const target = direction === 'up' ? index - 1 : index + 1
    if (index === -1 || target < 0 || target >= config.sections.length) {
      return { success: true }
    }
    const sections = [...config.sections]
    const [moved] = sections.splice(index, 1)
    if (moved) sections.splice(target, 0, moved)
    await setHomeConfig({ ...config, sections })
    revalidateHome()
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function searchProductsAction(
  input: unknown,
): Promise<{ success: true; products: ProductOption[] } | ServerActionError> {
  try {
    await requireRole('admin')
    const { search } = parseOrThrow(z.object({ search: z.string().default('') }), input)
    return { success: true, products: await searchProductOptions(search) }
  } catch (error) {
    return handleServerActionError(error)
  }
}
