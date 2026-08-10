import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Orden de ejecución (02-security.md):
 *  1. Rate limiting API_PUBLIC a /api/* (excepto /api/auth/*)
 *  2. Proteger /cuenta/* → redirigir a /login si no hay sesión
 *  3. Agregar security headers a todas las respuestas
 *
 * /admin/* lo maneja su propia auth; no se interfiere acá.
 */

const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token']

function securityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // CSP permisiva para Checkout Bricks de MP, Cloudinary y Google. El hardening
  // con nonces es un paso posterior (LAUNCH-03).
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // mlstatic.com es el CDN desde el que el SDK descarga el bundle de cada
      // Brick (op-cho-bricks). Sin él, `create()` resuelve sin error pero el
      // contenedor queda vacío: el Brick no llega a dibujarse nunca.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // mlstatic.com sirve los logos de tarjetas y medios de pago del Brick.
      // Los dominios de MercadoLibre van acá porque el pixel de fingerprint se
      // carga como imagen (mercadolivre.com, con "v", es el de Brasil).
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.mercadopago.com https://*.mlstatic.com https://*.mercadolibre.com https://*.mercadolivre.com https://lh3.googleusercontent.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      // api.cloudinary.com es el host de subida y NO es el mismo que
      // res.cloudinary.com (el de entrega, que va en img-src). Sin él, el
      // upload firmado del admin lo bloquea el navegador.
      // *.mercadolibre.com es obligatorio: el Payment Brick hace un fetch de
      // fingerprint de dispositivo contra mercadolibre.com antes de dibujarse.
      // Sin él el Brick falla con "Bricks component initialization failed" y no
      // renderiza nada — falla en silencio, sin disparar onError.
      "connect-src 'self' https://api.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com https://*.mercadolivre.com https://*.mlstatic.com https://api.cloudinary.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
      "frame-src 'self' https://*.mercadopago.com https://*.mercadolibre.com https://*.mercadolivre.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  )
  return response
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // 1. Rate limiting de APIs públicas (excepto las de auth)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const result = await rateLimit('API_PUBLIC', getClientIp(request))
    if (!result.success) {
      return securityHeaders(
        new NextResponse(
          JSON.stringify({ error: { message: 'Demasiados requests', code: 'RATE_LIMITED' } }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(result.retryAfter),
            },
          },
        ) as unknown as NextResponse,
      )
    }
  }

  // 2. Proteger /cuenta/*
  if (pathname.startsWith('/cuenta')) {
    const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name))
    if (!hasSession) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search)
      return securityHeaders(NextResponse.redirect(loginUrl))
    }
  }

  // 3. Security headers en todas las respuestas
  return securityHeaders(NextResponse.next())
}

export const config = {
  // Corre en todo menos assets estáticos.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
