/**
 * Importa a la DB los productos ya limpios por scripts/clean-stock.ts.
 *
 *   npx tsx --env-file=.env.local scripts/import-stock.ts
 *   npx tsx --env-file=.env.local scripts/import-stock.ts --dry-run
 *
 * Idempotente: la clave es el sku, así que correrlo de nuevo actualiza precio,
 * stock, nombre y estado en vez de duplicar. Eso lo hace también el camino para
 * refrescar el stock cuando el cliente manda una planilla nueva.
 *
 * No inventa nada: lee data/productos-limpios.json tal cual. Si hay que
 * cambiar cómo se limpia, se cambia clean-stock.ts y se regenera el archivo.
 */

import { readFileSync } from 'node:fs'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, categories } from '@/lib/db/schemas'
import type { ProductSpec } from '@/lib/db/schemas/products'

const INPUT = 'data/productos-limpios.json'
const BATCH_SIZE = 100

type CleanProduct = {
  sku: string
  slug: string
  name: string
  price: number
  stock: number
  brand: string | null
  active: boolean
  specs: ProductSpec[]
  categorySlug: string
}

function isCleanProduct(value: unknown): value is CleanProduct {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p['sku'] === 'string' &&
    typeof p['slug'] === 'string' &&
    typeof p['name'] === 'string' &&
    typeof p['price'] === 'number' &&
    typeof p['stock'] === 'number' &&
    (typeof p['brand'] === 'string' || p['brand'] === null) &&
    typeof p['active'] === 'boolean' &&
    Array.isArray(p['specs']) &&
    typeof p['categorySlug'] === 'string'
  )
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')

  const parsed: unknown = JSON.parse(readFileSync(INPUT, 'utf8'))
  if (!Array.isArray(parsed)) throw new Error(`${INPUT} no contiene un array.`)
  const rows: CleanProduct[] = parsed.map((row, i) => {
    if (!isCleanProduct(row)) throw new Error(`Fila ${i} de ${INPUT} tiene forma inesperada.`)
    return row
  })

  // Validaciones que no pueden fallar en la DB sin dejar basura a medias.
  const bad = rows.filter((r) => r.price <= 0 || r.stock < 0 || r.name.trim() === '' || r.sku.trim() === '')
  if (bad.length > 0) {
    throw new Error(`${bad.length} filas inválidas (precio, stock, nombre o sku). Primera: ${bad[0]?.sku}`)
  }
  const uniqueSkus = new Set(rows.map((r) => r.sku))
  const uniqueSlugs = new Set(rows.map((r) => r.slug))
  if (uniqueSkus.size !== rows.length) throw new Error('Hay skus duplicados en el archivo.')
  if (uniqueSlugs.size !== rows.length) throw new Error('Hay slugs duplicados en el archivo.')

  const catRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  const categoryIdBySlug = new Map(catRows.map((c) => [c.slug, c.id]))
  const faltantes = [...new Set(rows.map((r) => r.categorySlug))].filter((s) => !categoryIdBySlug.has(s))
  if (faltantes.length > 0) {
    throw new Error(`Faltan categorías en la DB: ${faltantes.join(', ')}. Corré generate-categories.ts.`)
  }

  const existing = await db.select({ sku: products.sku }).from(products)
  const existingSkus = new Set(existing.map((p) => p.sku).filter((s): s is string => s !== null))
  const nuevos = rows.filter((r) => !existingSkus.has(r.sku)).length

  console.log(`Archivo:    ${rows.length} productos`)
  console.log(`En la DB:   ${existing.length} productos`)
  console.log(`A insertar: ${nuevos}`)
  console.log(`A actualizar: ${rows.length - nuevos}`)
  console.log(`Inactivos:  ${rows.filter((r) => !r.active).length}`)

  if (dryRun) {
    console.log('\n--dry-run: no se escribió nada.')
    process.exit(0)
  }

  let written = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map((r) => ({
      sku: r.sku,
      slug: r.slug,
      name: r.name,
      price: r.price,
      stock: r.stock,
      brand: r.brand,
      active: r.active,
      specs: r.specs,
      categoryId: categoryIdBySlug.get(r.categorySlug) ?? null,
    }))

    await db
      .insert(products)
      .values(batch)
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          slug: sql`excluded.slug`,
          name: sql`excluded.name`,
          price: sql`excluded.price`,
          stock: sql`excluded.stock`,
          brand: sql`excluded.brand`,
          active: sql`excluded.active`,
          specs: sql`excluded.specs`,
          categoryId: sql`excluded.category_id`,
          updatedAt: sql`now()`,
        },
      })

    written += batch.length
    console.log(`  ${written}/${rows.length}`)
  }

  const [total] = await db.select({ n: sql<number>`count(*)::int` }).from(products)
  console.log(`\nListo. Productos en la DB: ${total?.n ?? '?'}`)
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error('Error importando el stock:', error)
  process.exit(1)
})
