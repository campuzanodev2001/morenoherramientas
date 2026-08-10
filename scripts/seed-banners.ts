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
 * Las imágenes son placeholders de picsum.photos con las medidas exactas de
 * cada recuadro, así se ve el recorte real de object-cover.
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
const SIZE: Record<BannerDevice, string> = {
  desktop: '1600/900',
  mobile: '900/1200',
}

const img = (device: BannerDevice, seed: string): string =>
  `https://picsum.photos/seed/${seed}/${SIZE[device]}`

const SLIDES: { title: string; linkUrl: string | null; seed: string }[] = [
  { title: 'Bocallaves y llaves de taller', linkUrl: '/productos', seed: 'moreno-bocallaves' },
  { title: 'Extractores y puesta a punto', linkUrl: '/productos', seed: 'moreno-extractores' },
  { title: 'Mechas y accesorios', linkUrl: null, seed: 'moreno-mechas' },
]

const SEED_BANNERS: SeedBanner[] = (['desktop', 'mobile'] as const).flatMap((device) =>
  SLIDES.map((slide, i) => ({
    title: `${slide.title} (${device})`,
    imageUrl: img(device, `${slide.seed}-${device}`),
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
