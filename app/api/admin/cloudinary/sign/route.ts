import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit/with-rate-limit'
import { requireRole } from '@/lib/auth/helpers'
import { handleApiError } from '@/lib/errors/handlers'
import { signCloudinaryParams } from '@/lib/cloudinary/sign'
import { env, clientEnv } from '@/lib/env'

/**
 * Genera una firma para subir imágenes directamente a Cloudinary desde el panel
 * admin. Solo accesible con rol admin. Nunca expone CLOUDINARY_API_SECRET.
 */
async function handler(request: Request): Promise<Response> {
  try {
    // 1. Rate limiting (vía withRateLimit)  2. Autorización
    await requireRole('admin')

    const body = (await request.json().catch(() => ({}))) as { folder?: unknown }
    const folder = typeof body.folder === 'string' && body.folder ? body.folder : 'productos'
    const timestamp = Math.floor(Date.now() / 1000)

    const signature = signCloudinaryParams({ folder, timestamp })

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      cloudName: clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withRateLimit('API_PUBLIC', handler)
