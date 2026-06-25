import { env } from '@/lib/env'
import { logWarn } from '@/lib/logger'
import type { ShipmentInfo, ShippingQuoteResult } from './types'

/**
 * Cotización de Correo Argentino (Mi Correo / Paq.ar).
 *
 * Igual que Andreani: con placeholders usa una estimación determinística para
 * que el checkout funcione sin servicios externos.
 */

const BASE_PRICE = 230000 // centavos ($2.300)
const PER_UNIT = 38000

function usesPlaceholder(): boolean {
  return env.CORREO_ARG_USER.startsWith('dev-')
}

function zoneSurcharge(postalCode: string): number {
  const firstDigit = Number(postalCode[0] ?? '1')
  return firstDigit >= 5 ? 90000 : 0
}

function estimate(info: ShipmentInfo): ShippingQuoteResult {
  return {
    carrier: 'correo-argentino',
    service: 'Correo Argentino Clásico',
    price: BASE_PRICE + info.totalUnits * PER_UNIT + zoneSurcharge(info.postalCode),
    estimatedDays: 7,
  }
}

export async function quoteCorreoArgentino(info: ShipmentInfo): Promise<ShippingQuoteResult> {
  if (usesPlaceholder()) return estimate(info)

  const res = await fetch('https://api.correoargentino.com.ar/micorreo/v1/rates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(`${env.CORREO_ARG_USER}:${env.CORREO_ARG_PASSWORD}`),
    },
    body: JSON.stringify({
      postalCodeDestination: info.postalCode,
      dimensions: { weight: info.weightGrams, height: 20, width: 20, length: 20 },
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    logWarn('shipping:correo', 'Respuesta no OK de Correo Argentino', { status: res.status })
    throw new Error(`Correo Argentino HTTP ${res.status}`)
  }

  const data = (await res.json()) as { rates?: { price?: number; deliveryTimeMax?: number }[] }
  const rate = data.rates?.[0]
  if (!rate || typeof rate.price !== 'number') throw new Error('Correo Argentino: tarifa inválida')

  return {
    carrier: 'correo-argentino',
    service: 'Correo Argentino Clásico',
    price: Math.round(rate.price * 100),
    estimatedDays: rate.deliveryTimeMax ?? 7,
  }
}
