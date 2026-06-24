import type { NextResponse } from 'next/server'
import { rateLimit, getClientIp, type RateLimitKey } from './index'
import { RateLimitError } from '@/lib/errors'
import { handleApiError } from '@/lib/errors/handlers'

type RouteHandler<C> = (request: Request, context: C) => Promise<Response> | Response

/**
 * Envuelve un handler de API route aplicando rate limiting por IP. Si se supera
 * el límite responde 429 con header Retry-After (vía RateLimitError).
 */
export function withRateLimit<C>(key: RateLimitKey, handler: RouteHandler<C>): RouteHandler<C> {
  return async (request, context) => {
    const result = await rateLimit(key, getClientIp(request))
    if (!result.success) {
      return handleApiError(new RateLimitError(result.retryAfter)) as NextResponse
    }
    return handler(request, context)
  }
}
