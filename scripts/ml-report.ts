/**
 * Convierte data/ml-progress.jsonl en un progress.md legible.
 *
 *   npx tsx scripts/ml-report.ts
 *
 * El JSONL es la fuente de verdad —lo escriben los scripts y aguanta consultas—
 * y este archivo es la vista para leer con ojos humanos. Se regenera entero
 * cada vez, así que no se edita a mano.
 *
 * No toca la DB ni la red: solo lee el progreso.
 */

import { writeFileSync } from 'node:fs'
import { loadProgress, type FieldState, type ProgressRecord } from './ml-progress'

const OUT = 'progress.md'
/** Cuántos motivos de falla distintos se listan antes de cortar. */
const TOP_REASONS = 12

function countBy<T>(items: readonly T[], key: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function ok(state: FieldState): boolean {
  return state.status === 'DONE'
}

function sum(records: readonly ProgressRecord[], pick: (r: ProgressRecord) => FieldState): number {
  return records.reduce((total, record) => {
    const state = pick(record)
    return total + (state.status === 'DONE' ? state.count : 0)
  }, 0)
}

function main(): void {
  const progress = loadProgress()
  const records = [...progress.values()]
  if (records.length === 0) {
    console.log('No hay nada en data/ml-progress.jsonl todavía. Corré scripts/ml-fetch.ts primero.')
    return
  }

  const matched = records.filter((r) => r.match.status === 'DONE')
  const failed = records.filter((r) => r.match.status === 'FAILED')

  const withSpecs = matched.filter((r) => ok(r.specs))
  const withImages = matched.filter((r) => ok(r.images))
  const withDescription = matched.filter((r) => ok(r.description))

  const contentApplied = records.filter((r) => r.applied.content === 'DONE')
  const imagesApplied = records.filter((r) => r.applied.images === 'DONE')

  const pct = (n: number): string => `${((100 * n) / records.length).toFixed(0)}%`

  const lines: string[] = []
  lines.push('# Enriquecimiento desde MercadoLibre')
  lines.push('')
  lines.push(`Generado el ${new Date().toISOString().slice(0, 16).replace('T', ' ')} por \`scripts/ml-report.ts\`.`)
  lines.push('No editar a mano: se regenera entero. La fuente es `data/ml-progress.jsonl`.')
  lines.push('')
  lines.push('## Resumen')
  lines.push('')
  lines.push('| | Productos | |')
  lines.push('|---|---:|---:|')
  lines.push(`| Procesados | ${records.length} | |`)
  lines.push(`| Con ficha encontrada | ${matched.length} | ${pct(matched.length)} |`)
  lines.push(`| — con specs | ${withSpecs.length} | ${pct(withSpecs.length)} |`)
  lines.push(`| — con fotos | ${withImages.length} | ${pct(withImages.length)} |`)
  lines.push(`| — con descripción | ${withDescription.length} | ${pct(withDescription.length)} |`)
  lines.push(`| Sin ficha | ${failed.length} | ${pct(failed.length)} |`)
  lines.push('')
  lines.push(
    `Specs disponibles: **${sum(matched, (r) => r.specs)}** · ` +
      `fotos disponibles: **${sum(matched, (r) => r.images)}**`,
  )
  lines.push('')
  lines.push('## Aplicado a la tienda')
  lines.push('')
  lines.push(`- Contenido (specs + descripción) escrito en la DB: **${contentApplied.length}**`)
  lines.push(`- Imágenes subidas a Cloudinary y asociadas: **${imagesApplied.length}**`)
  lines.push('')

  lines.push('## Por qué falló')
  lines.push('')
  if (failed.length === 0) {
    lines.push('Ningún producto sin ficha.')
  } else {
    lines.push('| Motivo | Productos |')
    lines.push('|---|---:|')
    for (const [reason, count] of countBy(failed, (r) =>
      r.match.status === 'FAILED' ? r.match.reason.replace(/\d+/g, 'N') : '?',
    ).slice(0, TOP_REASONS)) {
      lines.push(`| ${reason} | ${count} |`)
    }
  }
  lines.push('')

  lines.push('## Por marca')
  lines.push('')
  lines.push('| Marca | Procesados | Con ficha | Con fotos |')
  lines.push('|---|---:|---:|---:|')
  const brands = countBy(records, (r) => r.brand ?? '(sin marca)')
  for (const [brand, total] of brands.slice(0, 25)) {
    const ofBrand = records.filter((r) => (r.brand ?? '(sin marca)') === brand)
    const m = ofBrand.filter((r) => r.match.status === 'DONE').length
    const i = ofBrand.filter((r) => ok(r.images)).length
    lines.push(`| ${brand} | ${total} | ${m} | ${i} |`)
  }
  lines.push('')

  lines.push('## Revisar a mano')
  lines.push('')
  lines.push(
    'Productos cuyo EAN devolvió más de una ficha del catálogo. Se eligió la más ' +
      'completa, pero conviene mirarlos.',
  )
  lines.push('')
  const ambiguous = matched.filter((r) => r.match.status === 'DONE' && r.match.candidates > 1)
  if (ambiguous.length === 0) {
    lines.push('Ninguno.')
  } else {
    lines.push('| SKU | Nuestro nombre | Ficha elegida | Fichas |')
    lines.push('|---|---|---|---:|')
    for (const record of ambiguous.slice(0, 40)) {
      if (record.match.status !== 'DONE') continue
      lines.push(
        `| \`${record.sku}\` | ${record.name} | ${record.match.productName} | ${record.match.candidates} |`,
      )
    }
    if (ambiguous.length > 40) lines.push('')
    if (ambiguous.length > 40) lines.push(`…y ${ambiguous.length - 40} más.`)
  }
  lines.push('')

  writeFileSync(OUT, `${lines.join('\n')}\n`, 'utf8')
  console.log(
    `${OUT} generado · ${records.length} productos · ${matched.length} con ficha ` +
      `(${pct(matched.length)}) · ${withImages.length} con fotos`,
  )
}

main()
