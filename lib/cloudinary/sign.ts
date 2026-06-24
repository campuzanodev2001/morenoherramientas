import crypto from 'node:crypto'
import { env } from '@/lib/env'

/**
 * Firma de upload de Cloudinary: sha1(params ordenados + api_secret).
 * El API secret nunca sale del servidor.
 */
export function signCloudinaryParams(params: Record<string, string | number>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return crypto.createHash('sha1').update(toSign + env.CLOUDINARY_API_SECRET).digest('hex')
}
