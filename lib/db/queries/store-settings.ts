import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pages } from '@/lib/db/schemas'

/**
 * Una sección de la home: un título y la lista de productos elegidos a mano.
 * El orden del array `productIds` es el orden en que se muestran.
 */
export type HomeSection = {
  id: string
  title: string
  productIds: string[]
  active: boolean
}

export type HomeConfig = {
  hero: { title: string; ctaText: string }
  sections: HomeSection[]
}

type StoredContent = {
  hero?: Partial<HomeConfig['hero']>
  sections?: unknown
}

const HOME_SLUG = 'home'

const defaultHero: HomeConfig['hero'] = {
  title: 'Todo para tu taller en un solo lugar',
  ctaText: 'Buscar productos',
}

function isSection(value: unknown): value is HomeSection {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    Array.isArray(s.productIds) &&
    s.productIds.every((id) => typeof id === 'string')
  )
}

function readSections(raw: unknown): HomeSection[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isSection).map((s) => ({
    id: s.id,
    title: s.title,
    productIds: s.productIds,
    active: s.active !== false,
  }))
}

export async function getHomeConfig(): Promise<HomeConfig> {
  const [page] = await db.select().from(pages).where(eq(pages.slug, HOME_SLUG)).limit(1)
  const content = (page?.content as StoredContent | null) ?? {}
  return {
    hero: { ...defaultHero, ...content.hero },
    sections: readSections(content.sections),
  }
}

export async function setHomeConfig(next: HomeConfig): Promise<void> {
  await db
    .insert(pages)
    .values({ slug: HOME_SLUG, title: 'Home', content: next })
    .onConflictDoUpdate({ target: pages.slug, set: { content: next } })
}
