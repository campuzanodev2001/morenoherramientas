/**
 * Aplica a la DB las specs y la descripción bajadas por scripts/ml-fetch.ts.
 *
 *   npx tsx --env-file=.env.local scripts/ml-apply-content.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/ml-apply-content.ts
 *   npx tsx --env-file=.env.local scripts/ml-apply-content.ts --solo-specs
 *
 * ── Specs ──────────────────────────────────────────────────────────────────
 * Se suman a las que ya tiene el producto, nunca las pisan: lo que salió del
 * catálogo oficial de la marca vale más que lo que dice ML. Si una etiqueta ya
 * existe, la de ML se descarta.
 *
 * ── Descripción ────────────────────────────────────────────────────────────
 * La `short_description` de ML es texto de marketing autogenerado y a veces
 * afirma usos que no están respaldados por ninguna spec. Antes de pisar la
 * descripción actual, la vieja se guarda en data/ml-descripciones-previas.json,
 * así el paso es reversible sin volver a correr nada.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schemas'
import type { ProductSpec } from '@/lib/db/schemas/products'
import { appendProgress, loadProgress, rawPath, type ProgressRecord } from './ml-progress'

const BACKUP_FILE = 'data/ml-descripciones-previas.json'
const REPORT_FILE = 'data/reporte-ml-contenido.txt'

/**
 * Atributos de ML que no van a la ficha del comprador:
 * - GTIN es el propio código de barras, ya está en `sku`.
 * - BRAND ya vive en la columna `brand`.
 * Todo lo demás se conserva: ML ya devuelve la etiqueta en castellano.
 */
const SKIP_ATTRIBUTES = new Set(['GTIN', 'BRAND'])

type RawAttribute = { id?: unknown; name?: unknown; value_name?: unknown }
type RawProduct = {
  attributes?: unknown
  short_description?: { content?: unknown } | null
}

function readRaw(sku: string): RawProduct | null {
  const path = rawPath(sku)
  if (!existsSync(path)) return null
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
    if (typeof parsed !== 'object' || parsed === null) return null
    return parsed as RawProduct
  } catch {
    return null
  }
}

function specsFromRaw(raw: RawProduct): ProductSpec[] {
  if (!Array.isArray(raw.attributes)) return []
  const out: ProductSpec[] = []

  for (const entry of raw.attributes as RawAttribute[]) {
    const id = typeof entry.id === 'string' ? entry.id : ''
    const label = typeof entry.name === 'string' ? entry.name.trim() : ''
    const value = typeof entry.value_name === 'string' ? entry.value_name.trim() : ''

    if (id === '' || label === '' || value === '') continue
    if (SKIP_ATTRIBUTES.has(id)) continue
    // "Grano: 0" o "Cantidad de dientes: 0" es un hueco del dato, no un dato.
    if (/^0(\s|$)/.test(value)) continue

    out.push({ label, value })
  }
  return out
}

function descriptionFromRaw(raw: RawProduct): string | null {
  const content = raw.short_description?.content
  if (typeof content !== 'string') return null
  const trimmed = content.trim()
  return trimmed === '' ? null : trimmed
}

/** Compara etiquetas ignorando mayúsculas y acentos, para no duplicar filas. */
function labelKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function mergeSpecs(existing: readonly ProductSpec[], incoming: readonly ProductSpec[]) {
  const seen = new Set(existing.map((spec) => labelKey(spec.label)))
  const added: ProductSpec[] = []
  for (const spec of incoming) {
    const key = labelKey(spec.label)
    if (seen.has(key)) continue
    seen.add(key)
    added.push(spec)
  }
  return { merged: [...existing, ...added], added }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const onlySpecs = args.includes('--solo-specs')
  const force = args.includes('--force')

  const progress = loadProgress()
  const targets = [...progress.values()].filter(
    (record) =>
      record.match.status === 'DONE' &&
      (force || record.applied.content !== 'DONE') &&
      (record.specs.status === 'DONE' || record.description.status === 'DONE'),
  )

  console.log(
    `${progress.size} productos en el progreso · ${targets.length} con contenido para aplicar` +
      `${dryRun ? '  (DRY RUN, no se escribe nada)' : ''}\n`,
  )

  const backup: Record<string, string | null> = existsSync(BACKUP_FILE)
    ? (JSON.parse(readFileSync(BACKUP_FILE, 'utf8')) as Record<string, string | null>)
    : {}

  const report: string[] = []
  let specsApplied = 0
  let specsAdded = 0
  let descriptionsApplied = 0
  let skipped = 0

  for (const record of targets) {
    const raw = readRaw(record.sku)
    if (raw === null) {
      skipped++
      report.push(`${record.sku}\tSIN RAW\t${record.name}`)
      continue
    }

    const rows = await db
      .select({ id: products.id, specs: products.specs, description: products.description })
      .from(products)
      .where(eq(products.sku, record.sku))
      .limit(1)

    const current = rows[0]
    if (current === undefined) {
      skipped++
      report.push(`${record.sku}\tNO ESTÁ EN LA DB\t${record.name}`)
      continue
    }

    const { merged, added } = mergeSpecs(current.specs ?? [], specsFromRaw(raw))
    const incomingDescription = onlySpecs ? null : descriptionFromRaw(raw)

    const changes: Partial<{ specs: ProductSpec[]; description: string }> = {}
    if (added.length > 0) changes.specs = merged
    if (incomingDescription !== null && incomingDescription !== current.description) {
      changes.description = incomingDescription
    }

    if (Object.keys(changes).length === 0) {
      skipped++
      report.push(`${record.sku}\tSIN CAMBIOS\t${record.name}`)
      continue
    }

    if (!dryRun) {
      // La descripción vieja se guarda antes de pisarla, para poder revertir.
      if (changes.description !== undefined && !(record.sku in backup)) {
        backup[record.sku] = current.description
      }
      await db
        .update(products)
        .set({ ...changes, updatedAt: sql`now()` })
        .where(eq(products.id, current.id))

      const updated: ProgressRecord = {
        ...record,
        updatedAt: new Date().toISOString(),
        applied: { ...record.applied, content: 'DONE' },
        previousDescription: changes.description !== undefined ? current.description : null,
      }
      appendProgress(updated)
    }

    if (added.length > 0) {
      specsApplied++
      specsAdded += added.length
    }
    if (changes.description !== undefined) descriptionsApplied++

    report.push(
      `${record.sku}\t+${added.length} specs\t${changes.description !== undefined ? 'desc nueva' : 'desc igual'}\t${record.name}`,
    )
    console.log(
      `${record.sku}  +${added.length} specs  ` +
        `${changes.description !== undefined ? 'desc actualizada' : '-'}  · ${record.name.slice(0, 40)}`,
    )
  }

  if (!dryRun) {
    writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2), 'utf8')
    writeFileSync(REPORT_FILE, report.join('\n'), 'utf8')
  }

  console.log(
    `\nProductos con specs nuevas: ${specsApplied} (${specsAdded} specs en total)\n` +
      `Descripciones actualizadas: ${descriptionsApplied}\n` +
      `Sin cambios / salteados: ${skipped}` +
      (dryRun ? '\n\nDRY RUN: no se escribió nada.' : `\n\nBackup de descripciones: ${BACKUP_FILE}`),
  )
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
