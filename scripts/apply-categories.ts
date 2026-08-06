/**
 * Crea la taxonomía del catálogo y le asigna categoría a cada producto.
 *
 *   npx tsx --env-file=.env.local scripts/apply-categories.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/apply-categories.ts
 *
 * Las reglas viven en lib/catalog/categorization.ts. Este script solo las
 * aplica: crea las categorías que falten, asigna cada producto y borra las
 * categorías viejas que quedaron sin ningún producto (si no, la tienda muestra
 * secciones vacías).
 *
 * Se puede volver a correr: recalcula todo desde el nombre del producto.
 */

import { writeFileSync } from 'node:fs'
import { eq, inArray, sql, notInArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, products } from '@/lib/db/schemas'
import { allImportCategories, categorize, UNCATEGORIZED_SLUG } from '@/lib/catalog/categorization'

const OUT_REPORT = 'data/reporte-categorias.txt'

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')

  const taxonomy = allImportCategories()

  if (!dryRun) {
    for (let i = 0; i < taxonomy.length; i++) {
      const cat = taxonomy[i]
      if (!cat) continue
      await db
        .insert(categories)
        .values({ slug: cat.slug, name: cat.name, order: i })
        .onConflictDoUpdate({ target: categories.slug, set: { name: cat.name, order: i } })
    }
  }

  const catRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  const idBySlug = new Map(catRows.map((c) => [c.slug, c.id]))

  const rows = await db.select({ id: products.id, sku: products.sku, name: products.name }).from(products)

  // Agrupar por categoría para actualizar de a un statement por categoría.
  const bySlug = new Map<string, string[]>()
  const examples = new Map<string, string[]>()
  for (const p of rows) {
    const slug = categorize(p.name)
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), p.id])
    if ((examples.get(slug)?.length ?? 0) < 6) {
      examples.set(slug, [...(examples.get(slug) ?? []), p.name])
    }
  }

  if (!dryRun) {
    for (const [slug, ids] of bySlug) {
      const categoryId = idBySlug.get(slug)
      if (categoryId === undefined) continue
      for (let i = 0; i < ids.length; i += 200) {
        await db
          .update(products)
          .set({ categoryId, updatedAt: sql`now()` })
          .where(inArray(products.id, ids.slice(i, i + 200)))
      }
    }

    // Categorías que quedaron sin productos y no son parte de la taxonomía.
    const validSlugs = taxonomy.map((c) => c.slug)
    const stale = await db
      .select({ id: categories.id, slug: categories.slug })
      .from(categories)
      .where(notInArray(categories.slug, validSlugs))
    for (const s of stale) {
      const [used] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(products)
        .where(eq(products.categoryId, s.id))
      if ((used?.n ?? 0) === 0) await db.delete(categories).where(eq(categories.id, s.id))
    }
  }

  const ordered = [...bySlug.entries()].sort((a, b) => b[1].length - a[1].length)
  const total = rows.length
  const report = [
    'CATEGORIZACIÓN DEL CATÁLOGO',
    '',
    `Productos: ${total}`,
    `Categorías con productos: ${ordered.length}`,
    '',
    ...ordered.map(
      ([slug, ids]) =>
        `${String(ids.length).padStart(5)}  ${((ids.length * 100) / total).toFixed(1).padStart(5)}%  ${slug}`,
    ),
    '',
    '--- MUESTRA POR CATEGORÍA ---',
    ...ordered.flatMap(([slug]) => [
      '',
      `### ${slug}`,
      ...(examples.get(slug) ?? []).map((n) => `    ${n}`),
    ]),
    '',
    '--- SIN CATEGORIZAR ---',
    ...(examples.get(UNCATEGORIZED_SLUG) ?? ['  ninguno']).map((n) => `    ${n}`),
    '',
  ].join('\n')

  writeFileSync(OUT_REPORT, report)
  console.log(report.split('\n').slice(0, 30).join('\n'))
  console.log(`\nReporte → ${OUT_REPORT}`)
  if (dryRun) console.log('--dry-run: no se escribió en la DB.')
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error('Error categorizando:', error)
  process.exit(1)
})
