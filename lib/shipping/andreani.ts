import { env } from '@/lib/env'
import { logWarn } from '@/lib/logger'
import type { ShipmentInfo, ShippingQuoteResult } from './types'

/**
 * Cotización de Andreani.
 *
 * Con credenciales reales pega contra la API de Andreani. Con los placeholders
 * de `.env.local` (prefijo `dev-`) usa una estimación determinística para que
 * el checkout funcione en desarrollo sin servicios externos (mismo patrón
 * fail-soft que el rate limiting).
 */

const BASE_PRICE = 280000 // centavos ($2.800)
const PER_UNIT = 45000

function usesPlaceholder(): boolean {
  return env.ANDREANI_API_KEY.startsWith('dev-')
}

/** Recargo simple por zona según el primer dígito del CP. */
function zoneSurcharge(postalCode: string): number {
  const firstDigit = Number(postalCode[0] ?? '1')
  return firstDigit >= 5 ? 120000 : 0
}

function estimate(info: ShipmentInfo): ShippingQuoteResult {
  return {
    carrier: 'andreani',
    service: 'Andreani Estándar',
    price: BASE_PRICE + info.totalUnits * PER_UNIT + zoneSurcharge(info.postalCode),
    estimatedDays: 5,
  }
}

export async function quoteAndreani(info: ShipmentInfo): Promise<ShippingQuoteResult> {
  if (usesPlaceholder()) return estimate(info)

  const res = await fetch('https://apis.andreani.com/v2/tarifas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-authorization-token': env.ANDREANI_API_KEY,
      'x-client-id': env.ANDREANI_CLIENT_ID,
    },
    body: JSON.stringify({
      cpDestino: info.postalCode,
      contrato: env.ANDREANI_CLIENT_ID,
      bultos: [{ valorDeclarado: 0, volumen: info.totalUnits * 1000, kilos: info.weightGrams / 1000 }],
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    logWarn('shipping:andreani', 'Respuesta no OK de Andreani', { status: res.status })
    throw new Error(`Andreani HTTP ${res.status}`)
  }

  const data = (await res.json()) as { tarifaConIva?: { total?: number }; plazoEntrega?: number }
  const total = data.tarifaConIva?.total
  if (typeof total !== 'number') throw new Error('Andreani: tarifa inválida')

  return {
    carrier: 'andreani',
    service: 'Andreani Estándar',
    price: Math.round(total * 100),
    estimatedDays: data.plazoEntrega ?? 5,
  }
}
