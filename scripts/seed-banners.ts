/**
 * Seed de banners de PRUEBA para ver el carrusel de la home funcionando.
 * Borra TODOS los banners existentes y carga 3 de desktop (16:9) y 3 de
 * mobile (3:4).
 *
 *   npx tsx --env-file=.env.local scripts/seed-banners.ts
 *
 * Para borrar sin cargar nada:
 *   npx tsx --env-file=.env.local scripts/seed-banners.ts --reset
 *
 * Las imágenes son fotos de Unsplash (autos clásicos, garages y talleres
 * vintage), recortadas por URL a las medidas exactas de cada recuadro, así se
 * ve el recorte real de object-cover.
 */

import { db } from '@/lib/db'
import { banners } from '@/lib/db/schemas'
import type { BannerDevice } from '@/lib/db/types'

type SeedBanner = {
  title: string
  imageUrl: string
  linkUrl: string | null
  device: BannerDevice
  order: number
}

/** Medidas iguales a las que pide BannerCarousel para cada dispositivo. */
const SIZE: Record<BannerDevice, { w: number; h: number }> = {
  desktop: { w: 1600, h: 900 },
  mobile: { w: 900, h: 1200 },
}

/**
 * Unsplash recorta por URL: `fit=crop&crop=entropy` elige la zona con más
 * detalle, así el 3:4 de mobile no queda cortado en cualquier lado.
 */
const img = (device: BannerDevice, photoId: string): string => {
  const { w, h } = SIZE[device]
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&crop=entropy&q=80&w=${w}&h=${h}`
}

/**
 * Estética elegida con el cliente: garage de colección estilo "man cave"
 * — madera, luz cálida y tungsteno, autos clásicos lustrados y cartelería
 * vintage. NO taller sucio de trabajo: la referencia es curada y cálida.
 */
const SLIDES: { title: string; linkUrl: string | null; photoId: string }[] = [
  {
    // Galpón de madera lleno de clásicos, luz cálida colgante.
    title: 'Bocallaves y llaves de taller',
    linkUrl: '/productos',
    photoId: 'photo-1778589581479-e9ec96af28f2',
  },
  {
    // Garage en penumbra con paredes de madera y cartel de neón.
    title: 'Extractores y puesta a punto',
    linkUrl: '/productos',
    photoId: 'photo-1778761853160-a3e64c50625e',
  },
  {
    // Moto antigua y surtidor de nafta vintage con carteles de chapa.
    title: 'Mechas y accesorios',
    linkUrl: null,
    photoId: 'photo-1775900337863-334ecf22095a',
  },
]

const SEED_BANNERS: SeedBanner[] = (['desktop', 'mobile'] as const).flatMap((device) =>
  SLIDES.map((slide, i) => ({
    title: `${slide.title} (${device})`,
    imageUrl: img(device, slide.photoId),
    linkUrl: slide.linkUrl,
    device,
    order: i,
  })),
)

async function main() {
  const reset = process.argv.includes('--reset')

  const existing = await db.select().from(banners)
  await db.delete(banners)
  console.log(`Borrados ${existing.length} banners existentes.`)

  if (reset) {
    console.log('--reset: no se carga nada más.')
    return
  }

  const inserted = await db.insert(banners).values(SEED_BANNERS).returning()
  for (const b of inserted) {
    console.log(`  + [${b.device}] #${b.order} ${b.title}`)
  }
  console.log(`\nCargados ${inserted.length} banners de prueba.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
