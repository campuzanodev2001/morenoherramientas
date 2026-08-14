/**
 * Busca en el catálogo de MercadoLibre por NOMBRE los productos que el cruce
 * por código de barras no pudo resolver, y acepta la ficha solo si pasa todas
 * las validaciones de ml-verify.ts.
 *
 *   npx tsx --env-file=.env.local scripts/ml-match-names.ts --dry-run --limit=40
 *   npx tsx --env-file=.env.local scripts/ml-match-names.ts --brand=Eurotech
 *   npx tsx --env-file=.env.local scripts/ml-match-names.ts
 *
 * No escribe en la DB ni sube nada: deja el estado en data/ml-progress.jsonl y
 * la ficha cruda en data/ml-raw/, igual que ml-fetch.ts. Aplicar las fotos
 * sigue siendo trabajo de ml-apply-images.ts, que levanta estos registros solo.
 *
 * ── Qué se aplica y qué no ─────────────────────────────────────────────────
 *
 * SOLO LAS FOTOS. Las specs y la descripción quedan marcadas como FAILED a
 * propósito, así ml-apply-content.ts no las toca. Un match por nombre alcanza
 * para creerle a una foto —se ve, y si está mal se nota— pero no para copiar
 * medidas y materiales a la ficha del producto: un dato técnico equivocado no
 * se ve, se propaga, y contradice la regla de no publicar specs sin verificar.
 *
 * ── Ambigüedad ─────────────────────────────────────────────────────────────
 *
 * Si más de una ficha DISTINTA pasa todas las validaciones, el producto queda
 * sin foto. No se desempata por completitud como en el cruce por EAN: allá los
 * candidatos compartían GTIN y eran el mismo producto, acá dos fichas que
 * pasan pueden ser dos productos parecidos y elegir sería adivinar.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { attributeValue, searchCatalog, type MlProduct } from './ml-client'
import {
  appendProgress,
  loadProgress,
  rawPath,
  PROGRESS_FILE,
  RAW_DIR,
  type ProgressRecord,
} from './ml-progress'
import {
  extractDimensions,
  normalizeBrand,
  normalizeText,
  skuAppearsAsCode,
  verifyCandidate,
  type Candidate,
} from './ml-verify'
import type { MatchMethod } from './ml-progress'

const INPUT = 'data/productos-limpios.json'

type CleanProduct = { sku: string; name: string; brand: string | null }

function isCleanProduct(value: unknown): value is CleanProduct {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p['sku'] === 'string' &&
    typeof p['name'] === 'string' &&
    (typeof p['brand'] === 'string' || p['brand'] === null)
  )
}

/** Los ids con los que ML publica el modelo de fábrica, según el dominio. */
const MODEL_ATTRIBUTES = ['MODEL', 'PART_NUMBER', 'ALPHANUMERIC_MODEL'] as const

function toCandidate(product: MlProduct): Candidate {
  const models: string[] = []
  for (const id of MODEL_ATTRIBUTES) {
    const value = attributeValue(product, id)
    if (value !== null && value.trim() !== '') models.push(value)
  }
  return { name: product.name, brand: attributeValue(product, 'BRAND'), models }
}

/**
 * La query. Se le manda el nombre más la marca porque el buscador de ML pesa
 * la marca aparte; repetirla cuando ya está en el nombre no molesta.
 */
/**
 * Un SKU que puede ser el código del fabricante: corto y numérico. Los EAN-13
 * quedan afuera —esos ya los cruzó ml-fetch— y los códigos larguísimos que el
 * cliente inventó para productos sin código tampoco son de fábrica.
 */
function looksLikeFactoryCode(sku: string): boolean {
  const code = sku.trim()
  return /^\d{3,6}$/.test(code)
}

function buildQuery(product: CleanProduct): string {
  const brand = product.brand ?? ''
  const base = normalizeText(product.name).includes(normalizeText(brand))
    ? product.name
    : `${product.name} ${brand}`
  // ML corta las queries largas y devuelve ruido: con los primeros términos
  // significativos alcanza y el filtrado fino lo hace ml-verify.
  return base.split(/\s+/).filter(Boolean).slice(0, 10).join(' ')
}

type Outcome =
  | { kind: 'match'; product: MlProduct; evidence: string[]; method: MatchMethod }
  | { kind: 'reject'; reason: string }

function decide(our: CleanProduct, results: readonly MlProduct[]): Outcome {
  if (results.length === 0) return { kind: 'reject', reason: 'la búsqueda no devolvió resultados' }

  // ── Nivel alto: el SKU es el código de fábrica y está en la ficha ────────
  //
  // Se prueba primero y aparte porque no es un parecido: es el mismo código
  // leído de las dos fuentes. Igual se le exige que la marca coincida, para
  // que un código de cuatro dígitos que otra marca reutiliza no cuele.
  const byCode: { product: MlProduct; evidence: string[] }[] = []
  for (const result of results) {
    const candidate = toCandidate(result)
    if (!skuAppearsAsCode(our.sku, candidate)) continue
    // El código habilita la vía, no la resuelve: la ficha tiene que pasar
    // igual marca, tipo, juego, variantes y dimensiones.
    const verdict = verifyCandidate(our, candidate, { codeEvidence: true, skuToIgnore: our.sku })
    if (verdict.ok) byCode.push({ product: result, evidence: [`codigo=${our.sku}`, ...verdict.evidence] })
  }

  if (byCode.length > 0) {
    const names = new Set(
      byCode.map((entry) => normalizeText(entry.product.name).replace(/[^a-z0-9]/g, '')),
    )
    if (names.size > 1) {
      return {
        kind: 'reject',
        reason: `el código ${our.sku} cae en ${names.size} fichas distintas: ambiguo`,
      }
    }
    const best = [...byCode].sort(
      (a, b) => (b.product.pictures ?? []).length - (a.product.pictures ?? []).length,
    )[0]
    if (best !== undefined) {
      return { kind: 'match', product: best.product, method: 'codigo', evidence: best.evidence }
    }
  }

  // ── Nivel bajo: solo el nombre ──────────────────────────────────────────
  const passed: { product: MlProduct; evidence: string[] }[] = []
  const reasons = new Map<string, number>()

  for (const result of results) {
    const verdict = verifyCandidate(our, toCandidate(result), { skuToIgnore: our.sku })
    if (verdict.ok) passed.push({ product: result, evidence: verdict.evidence })
    else reasons.set(verdict.reason, (reasons.get(verdict.reason) ?? 0) + 1)
  }

  if (passed.length === 0) {
    // El motivo más frecuente resume bien por qué no entró ninguno.
    const top = [...reasons.entries()].sort((a, b) => b[1] - a[1])[0]
    return {
      kind: 'reject',
      reason: top ? `${results.length} candidato(s), ninguno válido: ${top[0]}` : 'sin candidatos válidos',
    }
  }

  // Dos fichas con el mismo nombre normalizado son la misma publicación
  // duplicada: eso no es ambigüedad. Dos nombres distintos, sí.
  const groups = new Map<string, { product: MlProduct; evidence: string[] }[]>()
  for (const entry of passed) {
    const key = normalizeText(entry.product.name).replace(/[^a-z0-9]/g, '')
    const bucket = groups.get(key)
    if (bucket === undefined) groups.set(key, [entry])
    else bucket.push(entry)
  }

  if (groups.size > 1) {
    const names = [...groups.values()]
      .map((entries) => entries[0]?.product.name ?? '?')
      .slice(0, 3)
      .join(' | ')
    return {
      kind: 'reject',
      reason: `ambiguo: ${groups.size} fichas distintas pasaron la validación (${names})`,
    }
  }

  const winners = [...groups.values()][0] ?? []
  const sorted = [...winners].sort((a, b) => {
    const active = Number(b.product.status === 'active') - Number(a.product.status === 'active')
    if (active !== 0) return active
    const pictures = (b.product.pictures ?? []).length - (a.product.pictures ?? []).length
    if (pictures !== 0) return pictures
    return a.product.id.localeCompare(b.product.id)
  })

  const best = sorted[0]
  if (best === undefined) return { kind: 'reject', reason: 'sin candidatos tras agrupar' }
  return { kind: 'match', product: best.product, evidence: best.evidence, method: 'nombre' }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? Number.parseInt(limitArg.slice('--limit='.length), 10) : Infinity
  const brandArg = args.find((a) => a.startsWith('--brand='))
  const brandFilter = brandArg ? normalizeText(brandArg.slice('--brand='.length)) : null

  const parsed: unknown = JSON.parse(readFileSync(INPUT, 'utf8'))
  if (!Array.isArray(parsed)) throw new Error(`${INPUT} no es un array`)
  const catalog = parsed.filter(isCleanProduct)

  const progress = loadProgress()

  // Solo los que siguen sin foto. Un match por EAN ya resuelto no se pisa
  // nunca: es prueba más fuerte que cualquier cosa que consigamos acá.
  const withoutPhoto = catalog.filter((product) => {
    const previous = progress.get(product.sku)
    if (previous === undefined) return true
    if (previous.match.status === 'DONE') return false
    return previous.applied.images !== 'DONE'
  })

  // Pre-filtro local: sin marca o sin dimensión en el nombre, verifyCandidate
  // va a rechazar todo igual. Descartarlos acá ahorra miles de llamadas.
  const skippedNoBrand: CleanProduct[] = []
  const skippedNoDimension: CleanProduct[] = []
  const verifiable: CleanProduct[] = []

  for (const product of withoutPhoto) {
    if (brandFilter !== null && normalizeText(product.brand ?? '') !== brandFilter) continue
    if (product.brand === null || product.brand.trim() === '') {
      skippedNoBrand.push(product)
      continue
    }
    // Sin dimensión en el nombre no hay forma de validar por nombre… salvo que
    // el SKU sea un código de fábrica, que es la vía fuerte y no la necesita.
    if (extractDimensions(product.name).size === 0 && !looksLikeFactoryCode(product.sku)) {
      skippedNoDimension.push(product)
      continue
    }
    verifiable.push(product)
  }

  const pending = force
    ? verifiable
    : verifiable.filter((product) => {
        const previous = progress.get(product.sku)
        // Ya lo intentamos por nombre y no dio: no repetir la llamada.
        return !(previous?.match.status === 'FAILED' && previous.match.reason.startsWith('[nombre]'))
      })

  const queue = pending.slice(0, Number.isFinite(limit) ? limit : pending.length)

  if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true })
  if (!existsSync(PROGRESS_FILE)) writeFileSync(PROGRESS_FILE, '', 'utf8')

  console.log(
    `Sin foto: ${withoutPhoto.length}\n` +
      `  descartados sin marca: ${skippedNoBrand.length}\n` +
      `  descartados sin dimensión en el nombre: ${skippedNoDimension.length}\n` +
      `  verificables: ${verifiable.length} · a consultar ahora: ${queue.length}` +
      `${dryRun ? '  (DRY RUN: no escribe nada)' : ''}\n`,
  )

  let matched = 0
  let rejected = 0
  let withPictures = 0
  const rejectReasons = new Map<string, number>()
  const byMethod = new Map<MatchMethod, number>()

  // Una ficha de ML es un producto: si dos SKU nuestros la reclaman, por lo
  // menos uno está mal. Pasó con dos prolongadores de encastre distinto que
  // cayeron los dos en la misma publicación. Se rechazan los dos, no se elige.
  const claimedBy = new Map<string, string>()
  const disputed: { sku: string; mlId: string; other: string }[] = []

  // Los matches que ya existen también reclaman su ficha, incluidos los del
  // cruce por EAN: si un match por nombre cae en una ficha que ya tiene dueño
  // probado por código de barras, el equivocado es el nuestro.
  for (const record of progress.values()) {
    if (record.match.status === 'DONE') claimedBy.set(record.match.productId, record.sku)
  }

  for (const [index, product] of queue.entries()) {
    let outcome: Outcome
    let found: MlProduct | null = null
    try {
      const search = await searchCatalog(buildQuery(product))
      outcome = decide(product, search.results)
      // El buscador ordena por relevancia de texto, así que la publicación que
      // lleva el código en el título puede no entrar por la query del nombre.
      // Si el nombre no resolvió y el SKU parece código, se pregunta de nuevo
      // por "marca + código", que es como la titulan los vendedores.
      if (outcome.kind === 'reject' && looksLikeFactoryCode(product.sku)) {
        const retry = await searchCatalog(`${product.brand ?? ''} ${product.sku}`.trim())
        const second = decide(product, retry.results)
        if (second.kind === 'match' && second.method === 'codigo') outcome = second
      }
      if (outcome.kind === 'match') found = outcome.product
    } catch (error) {
      outcome = {
        kind: 'reject',
        reason: `error de red/API: ${error instanceof Error ? error.message : String(error)}`,
      }
    }

    const position = `[${index + 1}/${queue.length}]`

    if (outcome.kind === 'reject' || found === null) {
      rejected++
      const reason = outcome.kind === 'reject' ? outcome.reason : 'sin ficha'
      const bucket = reason.split(':')[0] ?? reason
      rejectReasons.set(bucket, (rejectReasons.get(bucket) ?? 0) + 1)
      if (!dryRun) {
        appendProgress({
          sku: product.sku,
          name: product.name,
          brand: product.brand,
          updatedAt: new Date().toISOString(),
          match: { status: 'FAILED', reason: `[nombre] ${reason}` },
          specs: { status: 'FAILED', reason: 'sin match' },
          images: { status: 'FAILED', reason: 'sin match' },
          description: { status: 'FAILED', reason: 'sin match' },
          applied: { content: 'TODO', images: 'TODO' },
        })
      }
      console.log(`${position} --  ${product.sku}  ${reason.slice(0, 90)}  · ${product.name.slice(0, 35)}`)
      continue
    }

    const owner = claimedBy.get(found.id)
    if (owner !== undefined) {
      rejected++
      rejectReasons.set('ficha ya reclamada', (rejectReasons.get('ficha ya reclamada') ?? 0) + 1)
      disputed.push({ sku: product.sku, mlId: found.id, other: owner })
      if (!dryRun) {
        appendProgress({
          sku: product.sku,
          name: product.name,
          brand: product.brand,
          updatedAt: new Date().toISOString(),
          match: {
            status: 'FAILED',
            reason: `[nombre] la ficha ${found.id} ya la reclamó el SKU ${owner}: uno de los dos está mal`,
          },
          specs: { status: 'FAILED', reason: 'sin match' },
          images: { status: 'FAILED', reason: 'sin match' },
          description: { status: 'FAILED', reason: 'sin match' },
          applied: { content: 'TODO', images: 'TODO' },
        })
      }
      console.log(
        `${position} --  ${product.sku}  ficha ${found.id} ya reclamada por ${owner}  · ${product.name.slice(0, 35)}`,
      )
      continue
    }
    claimedBy.set(found.id, product.sku)

    matched++
    const pictures = found.pictures ?? []
    if (pictures.length > 0) withPictures++

    if (!dryRun) {
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
          candidates: 1,
          method: outcome.method,
          evidence: outcome.evidence,
        },
        // A propósito: un match por nombre habilita la foto, no el dato técnico.
        specs: { status: 'FAILED', reason: 'match por nombre: no se copian specs sin EAN' },
        images:
          pictures.length > 0
            ? { status: 'DONE', count: pictures.length }
            : { status: 'FAILED', reason: 'la ficha de ML no tiene fotos' },
        description: {
          status: 'FAILED',
          reason: 'match por nombre: no se copia descripción sin EAN',
        },
        applied: { content: 'TODO', images: 'TODO' },
      }
      appendProgress(record)
    }

    byMethod.set(outcome.method, (byMethod.get(outcome.method) ?? 0) + 1)
    console.log(
      `${position} OK[${outcome.method}]  ${product.sku}  fotos=${pictures.length}  ` +
        `[${outcome.evidence.join(' ')}]\n` +
        `        nuestro: ${product.name}\n` +
        `        ML:      ${found.name}`,
    )
  }

  // El disputante ya quedó rechazado dentro del bucle. Falta revocar al que
  // había reclamado la ficha primero: llegó antes, pero eso no lo hace
  // correcto. Con el JSONL append-only alcanza con escribir el estado nuevo.
  const revoked = new Set<string>()
  for (const conflict of disputed) {
    const previous = progress.get(conflict.other)
    // Un match por EAN está probado: manda sobre cualquier match por nombre.
    if (previous?.match.status === 'DONE' && previous.match.method !== 'nombre') continue
    if (revoked.has(conflict.other)) continue
    revoked.add(conflict.other)
    if (!dryRun) {
      const target = catalog.find((p) => p.sku === conflict.other)
      appendProgress({
        sku: conflict.other,
        name: target?.name ?? conflict.other,
        brand: target?.brand ?? null,
        updatedAt: new Date().toISOString(),
        match: {
          status: 'FAILED',
          reason: `[nombre] revocado: el SKU ${conflict.sku} reclamó la misma ficha ${conflict.mlId}`,
        },
        specs: { status: 'FAILED', reason: 'sin match' },
        images: { status: 'FAILED', reason: 'sin match' },
        description: { status: 'FAILED', reason: 'sin match' },
        applied: { content: 'TODO', images: 'TODO' },
      })
    }
    matched--
  }

  console.log(
    `\nMatch ${matched}/${queue.length} · con fotos ${withPictures} · rechazados ${rejected}\n` +
      `  por código de fábrica: ${byMethod.get('codigo') ?? 0}  (confianza alta)\n` +
      `  solo por nombre:       ${byMethod.get('nombre') ?? 0}  (confianza baja)`,
  )
  if (revoked.size > 0) {
    console.log(
      `Revocados por disputa de ficha: ${revoked.size} (${[...revoked].join(', ').slice(0, 120)})`,
    )
  }
  if (rejectReasons.size > 0) {
    console.log('\nPor qué se rechazaron:')
    for (const [reason, count] of [...rejectReasons.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(count).padStart(4)}  ${reason}`)
    }
  }
  if (dryRun) console.log('\nDRY RUN: no se escribió nada.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
