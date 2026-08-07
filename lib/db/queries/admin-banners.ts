import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { banners } from '@/lib/db/schemas'
import type { Banner, BannerDevice } from '@/lib/db/types'

export async function listBanners(): Promise<Banner[]> {
  return db.select().from(banners).orderBy(asc(banners.device), asc(banners.order))
}

export async function getBanner(id: string): Promise<Banner | null> {
  const [row] = await db.select().from(banners).where(eq(banners.id, id)).limit(1)
  return row ?? null
}

/** Banners vigentes de un dispositivo (activos y dentro de la ventana de fechas). */
export async function getActiveBanners(device: BannerDevice, now = new Date()): Promise<Banner[]> {
  const all = await db
    .select()
    .from(banners)
    .where(and(eq(banners.active, true), eq(banners.device, device)))
    .orderBy(asc(banners.order))
  return all.filter((b) => (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now))
}

/**
 * Banners vigentes de ambos dispositivos. El storefront renderiza los dos
 * juegos y esconde uno por CSS: qué banner corresponde se decide por el ancho
 * real de la pantalla, no por el user-agent, que miente.
 */
export async function getActiveBannersByDevice(
  now = new Date(),
): Promise<{ mobile: Banner[]; desktop: Banner[] }> {
  const [mobile, desktop] = await Promise.all([
    getActiveBanners('mobile', now),
    getActiveBanners('desktop', now),
  ])
  return { mobile, desktop }
}
