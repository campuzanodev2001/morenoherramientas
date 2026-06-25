import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors/handlers'
import { parseOrThrow } from '@/lib/errors/validation'
import { quoteRequestSchema } from '@/lib/validations/checkout'
import { priceCart } from '@/lib/checkout/pricing'
import { quoteShipping } from '@/lib/shipping'

/**
 * POST /api/envios/cotizar
 *
 * Rate limiting: API_PUBLIC ya lo aplica el middleware a /api/*.
 * Recalcula los items desde la DB (no confía en el cliente) y cotiza el envío
 * en paralelo a los dos carriers, devolviendo las opciones ordenadas por precio.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json()
    const { postalCode, items } = parseOrThrow(quoteRequestSchema, body)

    // Recalcular desde la DB; para cotizar no exigimos stock completo.
    const priced = await priceCart(items, { requireStock: false })

    const options = await quoteShipping(
      postalCode,
      priced.lines.map((l) => ({ quantity: l.quantity })),
    )

    return NextResponse.json({ options })
  } catch (error) {
    return handleApiError(error)
  }
}
