'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/helpers'
import { parseOrThrow } from '@/lib/errors/validation'
import { handleServerActionError, type ServerActionError } from '@/lib/errors/handlers'
import { getHomeConfig, setHomeConfig } from '@/lib/db/queries/store-settings'

const heroSchema = z.object({
  imageUrl: z.url('URL de imagen inválida'),
  title: z.string().min(1, 'Ingresá el título'),
  ctaText: z.string().min(1, 'Ingresá el texto del botón'),
})

const sectionsSchema = z.object({
  featuredTitle: z.string().min(1, 'Ingresá el título'),
  featuredProductIds: z.array(z.string().uuid()).default([]),
})

type Ok = { success: true }

export async function updateHeroAction(input: unknown): Promise<Ok | ServerActionError> {
  try {
    await requireRole('admin')
    const hero = parseOrThrow(heroSchema, input)
    const config = await getHomeConfig()
    await setHomeConfig({ ...config, hero })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function updateSectionsAction(input: unknown): Promise<Ok | ServerActionError> {
  try {
    await requireRole('admin')
    const sections = parseOrThrow(sectionsSchema, input)
    const config = await getHomeConfig()
    await setHomeConfig({ ...config, sections })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}
