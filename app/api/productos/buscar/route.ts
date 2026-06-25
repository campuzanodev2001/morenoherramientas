import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/rate-limit/with-rate-limit'
import { handleApiError } from '@/lib/errors/handlers'
import { parseOrThrow } from '@/lib/errors/validation'
import { searchProducts } from '@/lib/db/queries/search'

const searchParamsSchema = z.object({
  q: z.string().trim().min(1, 'Ingresá algo para buscar'),
  categoria: z.string().trim().optional(),
  precioMin: z.coerce.number().int().nonnegative().optional(),
  precioMax: z.coerce.number().int().nonnegative().optional(),
  cursor: z.string().optional(),
})

function decodeOffset(cursor: string | undefined): number {
  if (!cursor) return 0
  const n = Number(Buffer.from(cursor, 'base64url').toString('utf8'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function encodeOffset(offset: number): string {
  return Buffer.from(String(offset)).toString('base64url')
}

async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const params = parseOrThrow(searchParamsSchema, {
      q: url.searchParams.get('q') ?? '',
      categoria: url.searchParams.get('categoria') ?? undefined,
      precioMin: url.searchParams.get('precioMin') ?? undefined,
      precioMax: url.searchParams.get('precioMax') ?? undefined,
      cursor: url.searchParams.get('cursor') ?? undefined,
    })

    const result = await searchProducts({
      q: params.q,
      categorySlug: params.categoria,
      priceMin: params.precioMin,
      priceMax: params.precioMax,
      offset: decodeOffset(params.cursor),
    })

    return NextResponse.json({
      products: result.products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        price: p.price,
        stock: p.stock,
      })),
      total: result.total,
      nextCursor: result.nextOffset != null ? encodeOffset(result.nextOffset) : null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withRateLimit('SEARCH', handler)
