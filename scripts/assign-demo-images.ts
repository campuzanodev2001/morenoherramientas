/**
 * Asigna imágenes de demo a los productos que muestra la home.
 *
 * ⚠️  Es un script de PRUEBA. Las fotos salen de Wikimedia Commons y no son
 * de los productos reales del cliente: sirven para ver cómo queda la card
 * con una imagen de verdad. Créditos y licencias en
 * `docs/claude/demo-images-credits.md` — ocho son CC BY / CC BY-SA y exigen
 * atribución mientras estén publicadas.
 *
 * Los archivos ya están subidos a Cloudinary bajo `productos/demo/`, así que
 * el script no depende de tener nada en local.
 *
 * Idempotente: borra las imágenes de demo previas de cada producto antes de
 * insertar, así re-ejecutarlo no acumula filas. No toca ninguna imagen fuera
 * de la carpeta `productos/demo` de Cloudinary.
 *
 * Para sacarlas todas de una:
 *   DELETE FROM product_images WHERE url LIKE '%/productos/demo/%';
 *
 *   npx tsx --env-file=.env.local scripts/assign-demo-images.ts
 */
import { and, eq, like } from 'drizzle-orm'
import { db } from '@/lib/db'
import { productImages } from '@/lib/db/schemas'

const DEMO_PREFIX = 'https://res.cloudinary.com/dlj5r4rze/image/upload/productos/demo/'

/** SKU-agnóstico a propósito: los ids son los que hoy arma la home. */
const ASSIGNMENTS: { productId: string; file: string; alt: string }[] = [
  {
    productId: '7ad02fcd-27cc-44f0-8498-c0dcbac918c1',
    file: 'objeto-prueba.jpg',
    alt: 'Juego de herramientas de taller',
  },
  {
    productId: 'f9b194de-2d3a-4b80-84f6-ac3cf43bd002',
    file: 'arenadora.jpg',
    alt: 'Gabinete de arenado',
  },
  {
    productId: 'e3669734-a48b-4591-a201-3b9d76d9082d',
    file: 'llave-t-38.jpg',
    alt: 'Llave T hexagonal',
  },
  {
    productId: 'e18243de-8c60-453d-a091-e64d266eff6a',
    file: 'conica-38.jpg',
    alt: 'Mandriles de cono morse',
  },
  {
    productId: 'dde500d4-1877-4858-98a0-85c98f906d21',
    file: 'cilindrica-14.jpg',
    alt: 'Adaptador cilíndrico con mandril',
  },
  {
    productId: 'd67647b5-0505-4595-a698-29a111bfc61e',
    file: 'saca-filtro.jpg',
    alt: 'Llave saca filtro',
  },
  {
    productId: 'c377fad8-39c0-4a88-9442-82c11cf3f36c',
    file: 'cilindrica-38.jpg',
    alt: 'Mandril portabrocas',
  },
  {
    productId: 'bded9908-f7c4-4146-a4a9-e236e58c2dca',
    file: 'llave-t-8mm.jpg',
    alt: 'Juego de llaves hexagonales métricas',
  },
  {
    productId: 'ba63f46c-8123-41d7-a0dc-af42d7c004b5',
    file: 'electrodo.jpg',
    alt: 'Electrodos de soldadura',
  },
  {
    productId: 'b846b53b-22ac-49a4-a8c1-24b174554765',
    file: 'soldadora.jpg',
    alt: 'Soldadora inverter',
  },
  {
    productId: 'b651fe5e-4466-4f05-abb6-335d2c091b6d',
    file: 'llave-t-13mm.jpg',
    alt: 'Llaves hexagonales',
  },
  {
    productId: 'b22539b9-977f-4003-b081-87d6990ef9ca',
    file: 'llave-t-516.jpg',
    alt: 'Juego de llaves hexagonales',
  },
]

async function main(): Promise<void> {
  for (const { productId, file, alt } of ASSIGNMENTS) {
    await db
      .delete(productImages)
      .where(
        and(eq(productImages.productId, productId), like(productImages.url, `${DEMO_PREFIX}%`)),
      )
    // Si el producto ya tenía una imagen propia (Cloudinary), se la baja de
    // primaria en vez de borrarla: la card muestra la de demo y la original
    // sigue guardada para cuando estas se saquen.
    await db
      .update(productImages)
      .set({ isPrimary: false, order: 1 })
      .where(eq(productImages.productId, productId))
    await db.insert(productImages).values({
      productId,
      url: `${DEMO_PREFIX}${file}`,
      alt,
      order: 0,
      isPrimary: true,
    })
    console.log(`✓ ${productId} → ${file}`)
  }
  console.log(`\n${ASSIGNMENTS.length} imágenes de demo asignadas.`)
  process.exit(0)
}

void main()
