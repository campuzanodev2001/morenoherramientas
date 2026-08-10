/**
 * Reemplaza las secciones de la home por 3 secciones de prueba con 4 productos
 * cada una. Borra TODO lo que hubiera cargado antes en `sections`.
 *
 *   npx tsx --env-file=.env.local scripts/seed-home-sections.ts
 *
 * Los 12 productos salen del catálogo real (activos, con stock), repartidos sin
 * repetir entre las tres secciones. El hero no se toca.
 */

import { randomUUID } from 'crypto'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schemas'
import { getHomeConfig, setHomeConfig, type HomeSection } from '@/lib/db/queries/store-settings'

const TITLES = ['Productos Destacados', 'Ofertas de hoy', 'Herramientas nuevas'] as const
const PER_SECTION = 4

async function main(): Promise<void> {
  const rows = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(and(eq(products.active, true), isNull(products.deletedAt), gt(products.stock, 0)))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(TITLES.length * PER_SECTION)

  if (rows.length < TITLES.length * PER_SECTION) {
    console.error(
      `Se necesitan ${TITLES.length * PER_SECTION} productos activos con stock y solo hay ${rows.length}.`,
    )
    process.exit(1)
  }

  const sections: HomeSection[] = TITLES.map((title, i) => ({
    id: randomUUID(),
    title,
    productIds: rows.slice(i * PER_SECTION, (i + 1) * PER_SECTION).map((p) => p.id),
    active: true,
  }))

  const config = await getHomeConfig()
  console.log(`Borrando ${config.sections.length} sección(es) anterior(es).`)
  await setHomeConfig({ ...config, sections })

  for (const section of sections) {
    console.log(`\n${section.title}`)
    for (const id of section.productIds) {
      console.log(`  · ${rows.find((r) => r.id === id)?.name ?? id}`)
    }
  }
  console.log('\nListo.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
