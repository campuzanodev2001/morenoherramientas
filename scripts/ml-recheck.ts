/**
 * Vuelve a pasar las reglas de ml-verify.ts sobre los matches YA guardados,
 * usando la ficha cruda de data/ml-raw/. No consulta la API.
 *
 *   npm run ml:recheck              # informa, no toca nada
 *   npm run ml:recheck -- --apply   # revoca en el progreso los que ya no pasan
 *
 * Para qué sirve: cada vez que se endurece una regla, los matches aceptados
 * con las reglas viejas quedan sin auditar. Volver a correr ml-match-names
 * significa otra hora contra la API para llegar a las mismas fichas que ya
 * están en disco. Esto las relee y aplica las reglas nuevas en segundos.
 *
 * Solo mira los matches por `nombre` y por `codigo`. Los del cruce por EAN no
 * se tocan: ahí la identidad está probada por el código de barras y estas
 * reglas —pensadas para comparar nombres— solo pueden equivocarse.
 */

import { existsSync, readFileSync } from 'node:fs'
import { attributeValue, type MlProduct } from './ml-client'
import { appendProgress, loadProgress, rawPath, type ProgressRecord } from './ml-progress'
import { skuAppearsAsCode, verifyCandidate, type Candidate } from './ml-verify'

const MODEL_ATTRIBUTES = ['MODEL', 'PART_NUMBER', 'ALPHANUMERIC_MODEL'] as const

function toCandidate(product: MlProduct): Candidate {
  const models: string[] = []
  for (const id of MODEL_ATTRIBUTES) {
    const value = attributeValue(product, id)
    if (value !== null && value.trim() !== '') models.push(value)
  }
  return { name: product.name, brand: attributeValue(product, 'BRAND'), models }
}

function readRaw(sku: string): MlProduct | null {
  const path = rawPath(sku)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as MlProduct
  } catch {
    return null
  }
}

function main(): void {
  const apply = process.argv.slice(2).includes('--apply')
  const progress = loadProgress()

  const targets = [...progress.values()].filter(
    (record) =>
      record.match.status === 'DONE' &&
      (record.match.method === 'nombre' || record.match.method === 'codigo'),
  )

  console.log(`Matches por nombre/código a re-auditar: ${targets.length}\n`)

  let stillOk = 0
  const revoked: { record: ProgressRecord; reason: string }[] = []

  for (const record of targets) {
    if (record.match.status !== 'DONE') continue
    const raw = readRaw(record.sku)
    if (raw === null) {
      revoked.push({ record, reason: 'no está la ficha cruda en data/ml-raw/' })
      continue
    }

    const candidate = toCandidate(raw)
    const verdict = verifyCandidate(
      { name: record.name, brand: record.brand },
      candidate,
      {
        codeEvidence: skuAppearsAsCode(record.sku, candidate),
        skuToIgnore: record.sku,
      },
    )

    if (verdict.ok) {
      stillOk++
      continue
    }
    revoked.push({ record, reason: verdict.reason })
    console.log(`REVOCAR  ${record.sku}  ${verdict.reason}`)
    console.log(`         nuestro: ${record.name}`)
    console.log(`         ML:      ${raw.name}`)
  }

  console.log(`\nSiguen pasando: ${stillOk} · a revocar: ${revoked.length}`)

  if (!apply) {
    console.log('\nInforme nomás. Para aplicarlo: npm run ml:recheck -- --apply')
    return
  }

  for (const { record, reason } of revoked) {
    appendProgress({
      ...record,
      updatedAt: new Date().toISOString(),
      match: { status: 'FAILED', reason: `[recheck] ${reason}` },
      specs: { status: 'FAILED', reason: 'sin match' },
      images: { status: 'FAILED', reason: 'sin match' },
      description: { status: 'FAILED', reason: 'sin match' },
      applied: { ...record.applied, images: 'TODO' },
    })
  }
  console.log(`\nRevocados ${revoked.length} en el progreso.`)
}

main()
