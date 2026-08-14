/**
 * Estado del enriquecimiento desde MercadoLibre, producto por producto.
 *
 * El archivo es un JSONL append-only: cada script agrega líneas al final en vez
 * de reescribir. Si el proceso se corta a mitad de un barrido de mil productos,
 * lo ya hecho quedó en disco y se retoma sin repetir.
 *
 * Como una misma SKU puede aparecer varias veces (el fetch la escribió, después
 * el apply de imágenes la volvió a escribir), al leer gana la última aparición.
 *
 * El estado es POR CAMPO, no por producto: es normal conseguir las specs de un
 * producto y no sus fotos, y eso tiene que quedar registrado sin bloquear nada.
 */

import { appendFileSync, existsSync, readFileSync } from 'node:fs'

export const PROGRESS_FILE = 'data/ml-progress.jsonl'
export const RAW_DIR = 'data/ml-raw'

/** Un campo puede haberse resuelto, o haber fallado — y ahí queremos el motivo. */
export type FieldState =
  | { status: 'DONE'; count: number }
  | { status: 'FAILED'; reason: string }

/**
 * Cómo se probó que la ficha de ML es del mismo producto.
 *
 * `ean`    → el GTIN de la ficha es igual al SKU. Prueba directa.
 * `codigo` → el SKU es el código de fábrica y aparece en el título o en el
 *            modelo de la ficha. También es un identificador leído de las dos
 *            fuentes, no un parecido: la confianza es equiparable a `ean`.
 * `nombre` → no hay identificador que cruzar: se validó por marca + tipo +
 *            dimensiones del nombre. Es evidencia circunstancial, más débil, y
 *            por eso queda registrada pieza por pieza en `evidence`.
 */
export type MatchMethod = 'ean' | 'codigo' | 'nombre'

export type MatchState =
  | {
      status: 'DONE'
      productId: string
      productName: string
      permalink: string | null
      /** Cuántas fichas del catálogo tenían este mismo GTIN. */
      candidates: number
      /** Ausente en los registros viejos, que son todos por EAN. */
      method?: MatchMethod
      /** Qué coincidió, para poder auditar un match por nombre sin reprocesar. */
      evidence?: string[]
    }
  | { status: 'FAILED'; reason: string }

export type ProgressRecord = {
  sku: string
  name: string
  brand: string | null
  updatedAt: string
  match: MatchState
  /** Qué se consiguió de ML. Se llena en ml-fetch.ts. */
  specs: FieldState
  images: FieldState
  description: FieldState
  /** Qué se escribió efectivamente en la DB / Cloudinary. */
  applied: {
    content: 'TODO' | 'DONE' | 'FAILED'
    images: 'TODO' | 'DONE' | 'FAILED'
  }
  /** Descripción que tenía el producto antes de pisarla. Permite revertir. */
  previousDescription?: string | null
  appliedError?: string
}

export function appendProgress(record: ProgressRecord): void {
  appendFileSync(PROGRESS_FILE, `${JSON.stringify(record)}\n`, 'utf8')
}

/** Lee el JSONL colapsando duplicados: para cada SKU queda la última línea. */
export function loadProgress(): Map<string, ProgressRecord> {
  const bySku = new Map<string, ProgressRecord>()
  if (!existsSync(PROGRESS_FILE)) return bySku

  const lines = readFileSync(PROGRESS_FILE, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') continue
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      // Una línea cortada por un kill a mitad de escritura: se descarta sola.
      continue
    }
    if (typeof parsed !== 'object' || parsed === null) continue
    const record = parsed as ProgressRecord
    if (typeof record.sku !== 'string') continue
    bySku.set(record.sku, record)
  }
  return bySku
}

export function rawPath(sku: string): string {
  return `${RAW_DIR}/${sku}.json`
}
