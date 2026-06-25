import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pages } from '@/lib/db/schemas'

export type HomeConfig = {
  hero: { imageUrl: string; title: string; ctaText: string }
  sections: { featuredTitle: string; featuredProductIds: string[] }
}

const HOME_SLUG = 'home'

const defaults: HomeConfig = {
  hero: {
    imageUrl:
      'https://images.stockcake.com/public/7/a/4/7a4cb2d3-446b-436b-80c8-7c3bd836f274_large/vintage-garage-workshop-stockcake.jpg',
    title: 'Todo para tu taller en un solo lugar',
    ctaText: 'Buscar productos',
  },
  sections: { featuredTitle: 'Productos destacados', featuredProductIds: [] },
}

export async function getHomeConfig(): Promise<HomeConfig> {
  const [page] = await db.select().from(pages).where(eq(pages.slug, HOME_SLUG)).limit(1)
  const content = (page?.content as Partial<HomeConfig> | null) ?? {}
  return {
    hero: { ...defaults.hero, ...content.hero },
    sections: { ...defaults.sections, ...content.sections },
  }
}

export async function setHomeConfig(next: HomeConfig): Promise<void> {
  await db
    .insert(pages)
    .values({ slug: HOME_SLUG, title: 'Home', content: next })
    .onConflictDoUpdate({ target: pages.slug, set: { content: next } })
}
