/**
 * Sube a Cloudinary las fotos de las fichas de ML y las asocia al producto.
 *
 *   npx tsx --env-file=.env.local scripts/ml-apply-images.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/ml-apply-images.ts --limit=50
 *   npx tsx --env-file=.env.local scripts/ml-apply-images.ts
 *
 * Las imágenes NO se descargan a disco: a Cloudinary se le pasa la URL remota
 * en el parámetro `file` y él la baja de su lado. No queda nada local que
 * limpiar después.
 *
 * Es idempotente por `public_id`: el mismo producto y la misma posición
 * siempre escriben el mismo public_id, así que reprocesar reemplaza en vez de
 * duplicar. En la DB se borran las filas previas del producto antes de
 * insertar, por el mismo motivo.
 */

import { existsSync, readFileSync } from 'node:fs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, productImages } from '@/lib/db/schemas'
import { signCloudinaryParams } from '@/lib/cloudinary/sign'
import { env } from '@/lib/env'
import { appendProgress, loadProgress, rawPath, type ProgressRecord } from './ml-progress'

/** Tope por producto acordado para la tienda. */
const MAX_IMAGES = 6
const FOLDER = 'morenoherramientas/productos'

type RawPicture = { url?: unknown; secure_url?: unknown }
type RawProduct = { pictures?: unknown }

function readPictures(sku: string): string[] {
  const path = rawPath(sku)
  if (!existsSync(path)) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return []
  }
  if (typeof parsed !== 'object' || parsed === null) return []
  const raw = parsed as RawProduct
  if (!Array.isArray(raw.pictures)) return []

  const urls: string[] = []
  for (const picture of raw.pictures as RawPicture[]) {
    const url =
      typeof picture.secure_url === 'string'
        ? picture.secure_url
        : typeof picture.url === 'string'
          ? picture.url
          : null
    if (url !== null && !urls.includes(url)) urls.push(url)
  }
  return urls.slice(0, MAX_IMAGES)
}

/**
 * Sube por URL remota. Cloudinary firma todos los parámetros menos `file`,
 * `api_key` y `cloud_name`.
 */
async function uploadRemote(sourceUrl: string, publicId: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = signCloudinaryParams({ public_id: publicId, timestamp })

  const body = new URLSearchParams({
    file: sourceUrl,
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: env.CLOUDINARY_API_KEY,
    signature,
  })

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body },
  )
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Cloudinary HTTP ${response.status}: ${text.slice(0, 200)}`)
  }

  const parsed: unknown = JSON.parse(text)
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Cloudinary devolvió una respuesta inesperada')
  }
  const secureUrl = (parsed as { secure_url?: unknown }).secure_url
  if (typeof secureUrl !== 'string') {
    throw new Error('Cloudinary no devolvió secure_url')
  }
  return secureUrl
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? Number.parseInt(limitArg.slice('--limit='.length), 10) : Infinity

  const progress = loadProgress()
  const all = [...progress.values()].filter(
    (record) =>
      record.match.status === 'DONE' &&
      record.images.status === 'DONE' &&
      (force || record.applied.images !== 'DONE'),
  )
  const targets = all.slice(0, Number.isFinite(limit) ? limit : all.length)

  console.log(
    `${all.length} productos con fotos pendientes · procesando ${targets.length}` +
      `${dryRun ? '  (DRY RUN, no se sube ni se escribe)' : ''}\n`,
  )

  let uploaded = 0
  let productsDone = 0
  let failures = 0

  for (const [index, record] of targets.entries()) {
    const pictures = readPictures(record.sku)
    if (pictures.length === 0) {
      console.log(`[${index + 1}/${targets.length}] --  ${record.sku}  sin fotos en el raw`)
      continue
    }

    const rows = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.sku, record.sku))
      .limit(1)
    const product = rows[0]
    if (product === undefined) {
      console.log(`[${index + 1}/${targets.length}] --  ${record.sku}  no está en la DB`)
      continue
    }

    if (dryRun) {
      console.log(
        `[${index + 1}/${targets.length}] OK  ${record.sku}  subiría ${pictures.length} · ${record.name.slice(0, 40)}`,
      )
      continue
    }

    try {
      const urls: string[] = []
      for (const [position, source] of pictures.entries()) {
        urls.push(await uploadRemote(source, `${FOLDER}/${record.sku}-${position + 1}`))
        uploaded++
      }

      // Reemplazo completo: evita que una segunda corrida acumule duplicados.
      await db.delete(productImages).where(eq(productImages.productId, product.id))
      await db.insert(productImages).values(
        urls.map((url, position) => ({
          productId: product.id,
          url,
          alt: product.name,
          order: position,
          isPrimary: position === 0,
        })),
      )

      const updated: ProgressRecord = {
        ...record,
        updatedAt: new Date().toISOString(),
        applied: { ...record.applied, images: 'DONE' },
      }
      appendProgress(updated)
      productsDone++

      console.log(
        `[${index + 1}/${targets.length}] OK  ${record.sku}  ${urls.length} fotos · ${record.name.slice(0, 40)}`,
      )
    } catch (error) {
      failures++
      const reason = error instanceof Error ? error.message : String(error)
      appendProgress({
        ...record,
        updatedAt: new Date().toISOString(),
        applied: { ...record.applied, images: 'FAILED' },
        appliedError: reason,
      })
      console.log(`[${index + 1}/${targets.length}] ERR ${record.sku}  ${reason}`)
    }
  }

  console.log(
    `\nProductos con imágenes: ${productsDone} · imágenes subidas: ${uploaded} · fallas: ${failures}`,
  )
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
