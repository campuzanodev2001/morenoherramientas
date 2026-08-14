/**
 * Cruza el catálogo del cliente contra el catálogo de MercadoLibre y baja
 * specs, fotos y descripción de las fichas que matchean.
 *
 *   npx tsx --env-file=.env.local scripts/ml-fetch.ts --limit=20
 *   npx tsx --env-file=.env.local scripts/ml-fetch.ts
 *   npx tsx --env-file=.env.local scripts/ml-fetch.ts --all --force
 *
 * No escribe en la DB ni sube nada: deja todo en data/ml-progress.jsonl y
 * data/ml-raw/. Aplicar es trabajo de ml-apply-content.ts y ml-apply-images.ts.
 *
 * ── Cómo se decide que es el mismo producto ────────────────────────────────
 *
 * Solo por código de barras. Para las marcas internacionales el SKU que cargó
 * el cliente ES el EAN, y buscar ese EAN en el catálogo de ML devuelve la ficha
 * exacta. No hay fuzzy matching por nombre acá: es la misma trampa del catálogo
 * Bremen —un match plausible pero equivocado mete fotos y specs de otro
 * producto en silencio, y nadie lo audita después.
 *
 * Aun con el EAN puede volver más de una ficha (ML tiene duplicados y
 * variantes), así que además:
 *   1. Se exige que el atributo GTIN de la ficha sea igual al SKU.
 *   2. Se exige que la marca coincida con la que tenemos cargada.
 *   3. Recién entre las que pasan se elige, y se registra cuántas había.
 * Si ninguna pasa, el producto queda FAILED con el motivo. Nunca se adivina.
 *
 * Los SKU que no tienen forma de EAN quedan fuera por defecto (`--all` los
 * intenta igual, pero casi ninguno va a matchear: son códigos internos).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  attributeValue,
  normalizeGtin,
  searchCatalog,
  type MlProduct,
} from './ml-client'
import {
  appendProgress,
  loadProgress,
  rawPath,
  PROGRESS_FILE,
  RAW_DIR,
  type MatchState,
  type ProgressRecord,
} from './ml-progress'

const INPUT = 'data/productos-limpios.json'

type CleanProduct = { sku: string; name: string; brand: string | null }

/** EAN-13. Es la única forma de SKU que sirve para cruzar contra ML. */
const EAN13 = /^\d{13}$/

function isCleanProduct(value: unknown): value is CleanProduct {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p['sku'] === 'string' &&
    typeof p['name'] === 'string' &&
    (typeof p['brand'] === 'string' || p['brand'] === null)
  )
}

/**
 * Deja la marca comparable: sin acentos, sin espacios ni guiones, minúscula.
 * Así "DeWALT" y "Dewalt", o "PZ Force" y "PZ-Force", cuentan como iguales.
 */
function normalizeBrand(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

// ---------------------------------------------------------------------------
// Elección de ficha
// ---------------------------------------------------------------------------

type MatchResult =
  | { ok: true; product: MlProduct; candidates: number }
  | { ok: false; reason: string }

function pickMatch(
  product: CleanProduct,
  results: readonly MlProduct[],
): MatchResult {
  if (results.length === 0) {
    return { ok: false, reason: 'el EAN no existe en el catálogo de ML' }
  }

  const wanted = normalizeGtin(product.sku)
  const byGtin = results.filter((candidate) => {
    const gtin = attributeValue(candidate, 'GTIN')
    return gtin !== null && normalizeGtin(gtin) === wanted
  })
  if (byGtin.length === 0) {
    return {
      ok: false,
      reason: `hubo ${results.length} resultado(s) pero ninguno con GTIN igual al SKU`,
    }
  }

  let finalists = byGtin
  if (product.brand !== null && product.brand.trim() !== '') {
    const wantedBrand = normalizeBrand(product.brand)
    const byBrand = byGtin.filter((candidate) => {
      const brand = attributeValue(candidate, 'BRAND')
      if (brand === null) return false
      const found = normalizeBrand(brand)
      // Contención, no igualdad: el cliente carga "Bahco Argentina" o
      // "Lusqtoff Truper" donde ML pone "Bahco" y "Truper". Es la misma marca
      // con el importador pegado. Sigue rechazando marcas distintas de verdad
      // ("Bremen" contra "Wembley"), que es lo que la regla tiene que atajar.
      return found === wantedBrand || found.includes(wantedBrand) || wantedBrand.includes(found)
    })
    if (byBrand.length === 0) {
      const found = byGtin
        .map((candidate) => attributeValue(candidate, 'BRAND') ?? '?')
        .join(', ')
      return {
        ok: false,
        reason: `GTIN coincide pero la marca no: nuestra "${product.brand}", ML "${found}"`,
      }
    }
    finalists = byBrand
  }

  // Entre fichas legítimamente equivalentes preferimos la más completa: la que
  // está activa y trae más material. El desempate final por id es arbitrario
  // pero estable, para que dos corridas den lo mismo.
  const sorted = [...finalists].sort((a, b) => {
    const active = Number(b.status === 'active') - Number(a.status === 'active')
    if (active !== 0) return active
    const pictures = (b.pictures ?? []).length - (a.pictures ?? []).length
    if (pictures !== 0) return pictures
    const attributes = (b.attributes ?? []).length - (a.attributes ?? []).length
    if (attributes !== 0) return attributes
    return a.id.localeCompare(b.id)
  })

  const best = sorted[0]
  if (best === undefined) return { ok: false, reason: 'sin candidatos tras filtrar' }
  return { ok: true, product: best, candidates: finalists.length }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const all = args.includes('--all')
  const force = args.includes('--force')
  const retryFailed = args.includes('--retry-failed')
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? Number.parseInt(limitArg.slice('--limit='.length), 10) : Infinity

  const parsed: unknown = JSON.parse(readFileSync(INPUT, 'utf8'))
  if (!Array.isArray(parsed)) throw new Error(`${INPUT} no es un array`)
  const catalog = parsed.filter(isCleanProduct)

  const eligible = all ? catalog : catalog.filter((p) => EAN13.test(p.sku.trim()))

  const progress = loadProgress()
  const pending = eligible.filter((p) => {
    if (force) return true
    const previous = progress.get(p.sku)
    if (previous === undefined) return true
    if (retryFailed && previous.match.status === 'FAILED') return true
    return false
  })

  const queue = pending.slice(0, Number.isFinite(limit) ? limit : pending.length)

  if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true })
  if (!existsSync(PROGRESS_FILE)) writeFileSync(PROGRESS_FILE, '', 'utf8')

  console.log(
    `Catálogo: ${catalog.length} · elegibles: ${eligible.length} · ` +
      `ya procesados: ${eligible.length - pending.length} · a procesar ahora: ${queue.length}\n`,
  )

  let matched = 0
  let failed = 0
  let withImages = 0

  for (const [index, product] of queue.entries()) {
    let match: MatchResult
    try {
      const search = await searchCatalog(product.sku)
      match = pickMatch(product, search.results)
    } catch (error) {
      match = {
        ok: false,
        reason: `error de red/API: ${error instanceof Error ? error.message : String(error)}`,
      }
    }

    const position = `[${index + 1}/${queue.length}]`

    if (!match.ok) {
      failed++
      const state: MatchState = { status: 'FAILED', reason: match.reason }
      appendProgress({
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        updatedAt: new Date().toISOString(),
        match: state,
        specs: { status: 'FAILED', reason: 'sin match' },
        images: { status: 'FAILED', reason: 'sin match' },
        description: { status: 'FAILED', reason: 'sin match' },
        applied: { content: 'TODO', images: 'TODO' },
      })
      console.log(`${position} --  ${product.sku}  ${match.reason}  · ${product.name.slice(0, 40)}`)
      continue
    }

    matched++
    const found = match.product
    const pictures = found.pictures ?? []
    const attributes = found.attributes ?? []
    const descriptionText = found.short_description?.content ?? ''
    if (pictures.length > 0) withImages++

    writeFileSync(rawPath(product.sku), JSON.stringify(found, null, 2), 'utf8')

    const record: ProgressRecord = {
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      updatedAt: new Date().toISOString(),
      match: {
        status: 'DONE',
        productId: found.id,
        productName: found.name,
        permalink: found.permalink ?? null,
        candidates: match.candidates,
      },
      specs:
        attributes.length > 0
          ? { status: 'DONE', count: attributes.length }
          : { status: 'FAILED', reason: 'la ficha de ML no tiene atributos' },
      images:
        pictures.length > 0
          ? { status: 'DONE', count: pictures.length }
          : { status: 'FAILED', reason: 'la ficha de ML no tiene fotos' },
      description:
        descriptionText.trim() !== ''
          ? { status: 'DONE', count: descriptionText.length }
          : { status: 'FAILED', reason: 'la ficha de ML no tiene descripción' },
      applied: { content: 'TODO', images: 'TODO' },
    }
    appendProgress(record)

    console.log(
      `${position} OK  ${product.sku}  fotos=${pictures.length} specs=${attributes.length} ` +
        `desc=${descriptionText.length}  · ${product.name.slice(0, 40)}`,
    )
  }

  console.log(
    `\nMatch ${matched}/${queue.length} · con fotos ${withImages} · sin match ${failed}\n` +
      `Estado en ${PROGRESS_FILE}. Reporte legible: npx tsx scripts/ml-report.ts`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
