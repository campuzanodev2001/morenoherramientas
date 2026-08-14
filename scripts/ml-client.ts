/**
 * Cliente de la API de catálogo de MercadoLibre.
 *
 * No es un script ejecutable: lo usan scripts/ml-fetch.ts y compañía.
 *
 * Dos cosas a tener presentes sobre esta API:
 *
 * 1. `/sites/MLA/search` (publicaciones de vendedores) devuelve 403 aunque el
 *    token sea válido: ML la cerró. La que sí responde es `/products/search`,
 *    que es el CATÁLOGO — fichas canónicas de producto, no avisos. Para
 *    nosotros es mejor: las fotos son de ficha y los atributos vienen
 *    estructurados en vez de texto libre.
 *
 * 2. El token de `client_credentials` dura 6 horas y un barrido completo puede
 *    pasarse de eso, así que se renueva solo. Como no hay refresh token, la
 *    renovación es pedir uno nuevo con las mismas credenciales.
 */

import { z } from 'zod'
import { env } from '@/lib/env'

const TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'
const SEARCH_URL = 'https://api.mercadolibre.com/products/search'
const SITE_ID = 'MLA'

/** Separación mínima entre llamadas. Con 150 ms el barrido no despierta al 429. */
const THROTTLE_MS = 150
const MAX_RETRIES = 4

// ---------------------------------------------------------------------------
// Formas de respuesta
// ---------------------------------------------------------------------------

const tokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number(),
})

const mlAttributeSchema = z.object({
  id: z.string(),
  /** Etiqueta ya traducida al castellano ("Potencia", "Diámetro del disco"). */
  name: z.string().nullish(),
  value_name: z.string().nullish(),
})

// Ojo: ML devuelve max_width/max_height a veces como número y a veces como
// string. No los usamos, así que no los declaramos y nos ahorramos el problema.
const mlPictureSchema = z.object({
  id: z.string(),
  url: z.string().nullish(),
  secure_url: z.string().nullish(),
})

/**
 * La ficha viene completa dentro del resultado de búsqueda —con fotos,
 * atributos y descripción—, así que no hace falta un GET extra por candidato.
 */
const mlProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().nullish(),
  parent_id: z.string().nullish(),
  domain_id: z.string().nullish(),
  permalink: z.string().nullish(),
  pictures: z.array(mlPictureSchema).nullish(),
  attributes: z.array(mlAttributeSchema).nullish(),
  short_description: z.object({ content: z.string().nullish() }).nullish(),
})

const searchSchema = z.object({
  paging: z.object({ total: z.number() }),
  results: z.array(mlProductSchema).nullish(),
})

export type MlProduct = z.infer<typeof mlProductSchema>
export type MlPicture = z.infer<typeof mlPictureSchema>

export class MlHttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`MercadoLibre respondió HTTP ${status}: ${body.slice(0, 200)}`)
    this.name = 'MlHttpError'
  }
}

// ---------------------------------------------------------------------------
// Token y transporte
// ---------------------------------------------------------------------------

let token: { value: string; expiresAt: number } | null = null
let lastCallAt = 0

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getToken(): Promise<string> {
  if (token !== null && Date.now() < token.expiresAt) return token.value

  const clientId = env.ML_CLIENT_ID
  const clientSecret = env.ML_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error(
      'Faltan ML_CLIENT_ID / ML_CLIENT_SECRET en .env.local.\n' +
        'Se sacan de https://developers.mercadolibre.com.ar/devcenter (App ID y Secret Key).',
    )
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!response.ok) {
    throw new MlHttpError(response.status, await response.text())
  }

  const parsed = tokenSchema.parse(await response.json())
  // Un minuto de margen para no quedar justo en el límite a mitad de una llamada.
  token = {
    value: parsed.access_token,
    expiresAt: Date.now() + (parsed.expires_in - 60) * 1000,
  }
  return token.value
}

async function getJson(url: string): Promise<unknown> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const waitFor = THROTTLE_MS - (Date.now() - lastCallAt)
    if (waitFor > 0) await sleep(waitFor)
    lastCallAt = Date.now()

    let response: Response
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })
    } catch (error) {
      // Corte de red: reintentar con backoff.
      lastError = error
      await sleep(2 ** attempt * 1000)
      continue
    }

    if (response.ok) return response.json()

    // Token vencido o revocado: lo tiramos y el próximo intento pide uno nuevo.
    if (response.status === 401) {
      token = null
      lastError = new MlHttpError(401, await response.text())
      continue
    }

    if (response.status === 429 || response.status >= 500) {
      lastError = new MlHttpError(response.status, await response.text())
      await sleep(2 ** attempt * 1000)
      continue
    }

    throw new MlHttpError(response.status, await response.text())
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`No se pudo completar la llamada a ${url}`)
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export type CatalogSearch = { total: number; results: MlProduct[] }

/** Busca en el catálogo de MLA. Para cruzar por EAN, `query` es el propio EAN. */
export async function searchCatalog(query: string): Promise<CatalogSearch> {
  const url = `${SEARCH_URL}?site_id=${SITE_ID}&q=${encodeURIComponent(query)}`
  const parsed = searchSchema.parse(await getJson(url))
  return { total: parsed.paging.total, results: parsed.results ?? [] }
}

/** Valor de un atributo de la ficha, por id de ML (`GTIN`, `BRAND`, …). */
export function attributeValue(product: MlProduct, id: string): string | null {
  const found = (product.attributes ?? []).find((attribute) => attribute.id === id)
  return found?.value_name ?? null
}

/**
 * Normaliza un código de barras para poder compararlo: ML devuelve el mismo
 * GTIN a veces con cero a la izquierda ("07795163035091") y a veces sin él.
 */
export function normalizeGtin(value: string): string {
  return value.replace(/\D/g, '').replace(/^0+/, '')
}
