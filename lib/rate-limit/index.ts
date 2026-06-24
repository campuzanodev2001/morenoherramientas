import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'
import { logWarn } from '@/lib/logger'

/**
 * Rate limiting con Upstash Redis (sliding window).
 *
 * En desarrollo, con la URL placeholder de `.env.local`, el rate limiting se
 * desactiva (fail-open) para no agregar latencia ni romper el dev server. En
 * cualquier error de red también falla abierto, loggeando un warning.
 */

export const RATE_LIMITS = {
  LOGIN: { limit: 5, window: '15 m' },
  CHECKOUT: { limit: 10, window: '1 m' },
  API_PUBLIC: { limit: 60, window: '1 m' },
  WEBHOOK: { limit: 100, window: '1 m' },
  SEARCH: { limit: 30, window: '1 m' },
} as const satisfies Record<string, { limit: number; window: Duration }>

export type RateLimitKey = keyof typeof RATE_LIMITS

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  retryAfter: number // segundos
}

function isEnabled(): boolean {
  return !env.UPSTASH_REDIS_URL.includes('dev.upstash.io')
}

let redis: Redis | null = null
function getRedis(): Redis {
  redis ??= new Redis({ url: env.UPSTASH_REDIS_URL, token: env.UPSTASH_REDIS_TOKEN })
  return redis
}

const limiters = new Map<RateLimitKey, Ratelimit>()
function getLimiter(key: RateLimitKey): Ratelimit {
  let limiter = limiters.get(key)
  if (!limiter) {
    const { limit, window } = RATE_LIMITS[key]
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `rl:${key}`,
      analytics: false,
    })
    limiters.set(key, limiter)
  }
  return limiter
}

/**
 * Aplica el límite `key` al `identifier` (normalmente la IP). Falla abierto en
 * desarrollo o ante errores de red.
 */
export async function rateLimit(key: RateLimitKey, identifier: string): Promise<RateLimitResult> {
  const { limit } = RATE_LIMITS[key]
  if (!isEnabled()) {
    return { success: true, limit, remaining: limit, retryAfter: 0 }
  }
  try {
    const res = await getLimiter(key).limit(identifier)
    const retryAfter = res.success ? 0 : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000))
    return { success: res.success, limit: res.limit, remaining: res.remaining, retryAfter }
  } catch (error) {
    logWarn('rate-limit', 'Fallo del limiter, se permite el request (fail-open)', {
      key,
      error: error instanceof Error ? error.message : 'unknown',
    })
    return { success: true, limit, remaining: limit, retryAfter: 0 }
  }
}

/**
 * Extrae la IP real del cliente. En Vercel, X-Forwarded-For es una lista
 * `cliente, proxy1, proxy2`; la IP real es la PRIMERA.
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip')?.trim() || '127.0.0.1'
}
