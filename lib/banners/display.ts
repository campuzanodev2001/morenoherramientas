import type { BannerDevice } from '@/lib/db/types'

/**
 * Proporción fija del recuadro del banner, independiente del tamaño de la
 * imagen que se suba: la imagen se recorta con object-cover para llenarlo.
 * Fuente única para el preview del admin y para el storefront, así lo que ve
 * el que carga el banner es lo que ve el comprador.
 */
export const BANNER_ASPECT_CLASS: Record<BannerDevice, string> = {
  mobile: 'aspect-[3/4]',
  desktop: 'aspect-[16/9]',
}

/**
 * Ancho del recuadro en el storefront: el menor entre el ancho disponible y el
 * que sale del alto disponible (`cqh` = alto del contenedor). El alto lo deriva
 * después `aspect-ratio`.
 *
 * Topear con `max-width: 100%` un recuadro de alto fijo NO sirve: recorta el
 * ancho sin bajar el alto y deja la proporción deformada. Medido: en 1920x1080
 * el banner quedaba 1152x791 (1.46) en vez de 16:9.
 */
export const BANNER_WIDTH_CLASS: Record<BannerDevice, string> = {
  mobile: 'w-[min(100%,75cqh)]',
  desktop: 'w-[min(100%,177.78cqh)]',
}

/** ancho / alto. Se usa para topear el ancho contra el alto disponible. */
export const BANNER_RATIO: Record<BannerDevice, number> = {
  mobile: 3 / 4,
  desktop: 16 / 9,
}

export const BANNER_DEVICE_LABEL: Record<BannerDevice, string> = {
  mobile: 'Mobile (vertical 3:4)',
  desktop: 'Desktop (apaisado 16:9)',
}

export const BANNER_DEVICES: BannerDevice[] = ['desktop', 'mobile']
