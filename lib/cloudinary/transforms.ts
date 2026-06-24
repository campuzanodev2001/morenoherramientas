import { clientEnv } from '@/lib/env'

const CLOUD_NAME = clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

export const transforms = {
  thumbnail: 'w_80,h_80,c_fill,q_auto,f_auto',
  card: 'w_400,h_400,c_fit,q_auto,f_auto',
  gallery: 'w_800,h_800,c_fit,q_auto,f_auto',
  zoom: 'w_1200,h_1200,c_fit,q_auto,f_auto',
} as const

export type TransformKey = keyof typeof transforms

/** Construye la URL de Cloudinary aplicando una transformación por nombre. */
export function cloudinaryUrl(publicId: string, transform: TransformKey): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms[transform]}/${publicId}`
}
