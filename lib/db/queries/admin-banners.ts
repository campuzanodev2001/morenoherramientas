import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { banners } from '@/lib/db/schemas'
import type { Banner } from '@/lib/db/types'

export async function listBanners(): Promise<Banner[]> {
  return db.select().from(banners).orderBy(asc(banners.order))
}

export async function getBanner(id: string): Promise<Banner | null> {
  const [row] = await db.select().from(banners).where(eq(banners.id, id)).limit(1)
  return row ?? null
}

/** Banners vigentes para el storefront (activos y dentro de la ventana de fechas). */
export async function getActiveBanners(now = new Date()): Promise<Banner[]> {
  const all = await db.select().from(banners).where(eq(banners.active, true)).orderBy(asc(banners.order))
  return all.filter(
    (b) => (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now),
  )
}
