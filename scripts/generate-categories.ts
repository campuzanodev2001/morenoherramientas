/**
 * Inserta las categorías predefinidas de la importación si no existen.
 * Ejecutar ANTES de import-products.ts:
 *
 *   npx tsx --env-file=.env.local scripts/generate-categories.ts
 */

import { db } from '@/lib/db'
import { categories } from '@/lib/db/schemas'
import { allImportCategories } from '@/lib/catalog/categorization'

async function main(): Promise<void> {
  const rows = allImportCategories()
  let created = 0

  for (let i = 0; i < rows.length; i++) {
    const cat = rows[i]
    if (!cat) continue
    const inserted = await db
      .insert(categories)
      .values({ slug: cat.slug, name: cat.name, order: i })
      .onConflictDoNothing({ target: categories.slug })
      .returning({ id: categories.id })
    if (inserted.length > 0) created++
  }

  console.log(`Categorías: ${created} creadas, ${rows.length - created} ya existían.`)
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error('Error generando categorías:', error)
  process.exit(1)
})
