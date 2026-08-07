'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { banners } from '@/lib/db/schemas'
import { requireRole } from '@/lib/auth/helpers'
import { parseOrThrow } from '@/lib/errors/validation'
import { handleServerActionError, type ServerActionError } from '@/lib/errors/handlers'
import { NotFoundError } from '@/lib/errors'
import { bannerInputSchema, type BannerInput } from '@/lib/validations/banner'

type Result = { success: true; id: string } | ServerActionError

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function revalidate() {
  revalidatePath('/admin/banners')
  revalidatePath('/')
}

export async function createBannerAction(input: BannerInput): Promise<Result> {
  try {
    await requireRole('admin')
    const data = parseOrThrow(bannerInputSchema, input)
    const [created] = await db
      .insert(banners)
      .values({
        title: data.title,
        imageUrl: data.imageUrl,
        device: data.device,
        linkUrl: data.linkUrl || null,
        order: data.order,
        active: data.active,
        startsAt: parseDate(data.startsAt),
        endsAt: parseDate(data.endsAt),
      })
      .returning({ id: banners.id })
    if (!created) throw new Error('insert failed')
    revalidate()
    return { success: true, id: created.id }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function updateBannerAction(id: string, input: BannerInput): Promise<Result> {
  try {
    await requireRole('admin')
    const data = parseOrThrow(bannerInputSchema, input)
    const [existing] = await db.select({ id: banners.id }).from(banners).where(eq(banners.id, id)).limit(1)
    if (!existing) throw new NotFoundError('Banner no encontrado')

    await db
      .update(banners)
      .set({
        title: data.title,
        imageUrl: data.imageUrl,
        device: data.device,
        linkUrl: data.linkUrl || null,
        order: data.order,
        active: data.active,
        startsAt: parseDate(data.startsAt),
        endsAt: parseDate(data.endsAt),
      })
      .where(eq(banners.id, id))
    revalidate()
    return { success: true, id }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function deleteBannerAction(id: string): Promise<{ success: true } | ServerActionError> {
  try {
    await requireRole('admin')
    await db.delete(banners).where(eq(banners.id, id))
    revalidate()
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}
