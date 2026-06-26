/**
 * Importación masiva de productos.
 *
 *   npx tsx --env-file=.env.local scripts/import-products.ts ./data/STOCK.csv
 *
 * El archivo del proveedor está en Excel; exportalo a CSV (UTF-8) antes de
 * correr el script. Columnas esperadas: Código, Producto, Departamento,
 * Existencia (08-launch.md). El precio viene embebido en Producto como
 * "NOMBRE /PRECIO/".
 *
 * Generá las categorías primero con scripts/generate-categories.ts.
 */

import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, categories } from '@/lib/db/schemas'
import { slugify } from '@/lib/utils/slug'
import { categorize } from '@/lib/catalog/categorization'

const BATCH_SIZE = 100
const ERRORS_LOG = 'import-errors.log'
const REPORT = 'import-report.txt'

type ParsedRow = {
  slug: string
  name: string
  sku: string
  brand: string | null
  price: number // centavos
  stock: number
  categoryId: string | null
}

/** Parser CSV mínimo con soporte de campos entre comillas. */
function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields.map((f) => f.trim())
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

async function main(): Promise<void> {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Uso: npx tsx scripts/import-products.ts <archivo.csv>')
    process.exit(1)
  }

  const raw = readFileSync(filePath, 'utf8')
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) {
    console.error('El archivo no tiene filas de datos.')
    process.exit(1)
  }

  const headerLine = lines[0] ?? ''
  const delimiter = (headerLine.match(/;/g)?.length ?? 0) > (headerLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const header = parseCsvLine(headerLine, delimiter).map(normalizeHeader)
  const idx = {
    codigo: header.indexOf('codigo'),
    producto: header.indexOf('producto'),
    departamento: header.indexOf('departamento'),
    existencia: header.indexOf('existencia'),
  }
  if (idx.codigo < 0 || idx.producto < 0) {
    console.error('Faltan columnas requeridas (Código / Producto).')
    process.exit(1)
  }

  // Mapas de apoyo: categorías por slug y slugs/skus existentes.
  const catRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
  const categoryIdBySlug = new Map(catRows.map((c) => [c.slug, c.id]))
  const existingProducts = await db.select({ slug: products.slug, sku: products.sku }).from(products)
  const usedSlugs = new Set(existingProducts.map((p) => p.slug))
  const existingSkus = new Set(existingProducts.map((p) => p.sku).filter((s): s is string => Boolean(s)))

  let processed = 0
  let inserted = 0
  let updated = 0
  let errors = 0
  writeFileSync(ERRORS_LOG, '')

  function logError(rowNum: number, reason: string, data: string): void {
    errors++
    appendFileSync(ERRORS_LOG, `[fila ${rowNum}] [${reason}] ${data}\n`)
  }

  let batch: ParsedRow[] = []

  async function flush(): Promise<void> {
    if (batch.length === 0) return
    await db
      .insert(products)
      .values(batch)
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          name: sql`excluded.name`,
          price: sql`excluded.price`,
          brand: sql`excluded.brand`,
          stock: sql`excluded.stock`,
        },
      })
    batch = []
  }

  for (let i = 1; i < lines.length; i++) {
    processed++
    const rowNum = i + 1
    const cells = parseCsvLine(lines[i] ?? '', delimiter)
    const productoRaw = cells[idx.producto] ?? ''
    const codigo = (cells[idx.codigo] ?? '').trim()

    const priceMatch = productoRaw.match(/\/?(\d+)\/\s*$/)
    if (!priceMatch || !priceMatch[1]) {
      logError(rowNum, 'sin precio', productoRaw)
      continue
    }
    if (!codigo) {
      logError(rowNum, 'sin codigo', productoRaw)
      continue
    }

    const price = Number(priceMatch[1]) * 100 // pesos → centavos
    const name = productoRaw.replace(/\s*\/?\d+\/\s*$/, '').trim()
    if (!name) {
      logError(rowNum, 'nombre vacio', productoRaw)
      continue
    }

    const brand = idx.departamento >= 0 ? (cells[idx.departamento] ?? '').trim() || null : null
    const stock = idx.existencia >= 0 ? Math.max(0, Number(cells[idx.existencia] ?? '0') || 0) : 0

    // Slug único: si choca, agregar el SKU.
    let slug = slugify(name)
    if (usedSlugs.has(slug)) slug = `${slug}-${slugify(codigo)}`
    usedSlugs.add(slug)

    const categoryId = categoryIdBySlug.get(categorize(name)) ?? null

    if (existingSkus.has(codigo)) updated++
    else {
      inserted++
      existingSkus.add(codigo)
    }

    batch.push({ slug, name, sku: codigo, brand, price, stock, categoryId })
    if (batch.length >= BATCH_SIZE) await flush()
  }

  await flush()

  const report = [
    `Total filas procesadas: ${processed}`,
    `Insertados: ${inserted}`,
    `Actualizados: ${updated}`,
    `Errores: ${errors}`,
  ].join('\n')
  writeFileSync(REPORT, report + '\n')
  console.log(report)
  console.log(`Detalle de errores en ${ERRORS_LOG}`)
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error('Error en la importación:', error)
  process.exit(1)
})
