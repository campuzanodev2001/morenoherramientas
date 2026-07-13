/**
 * Seed de productos MOCK para testear los flujos de la app (catálogo, carrito,
 * checkout, admin) sin el CSV real del proveedor. Idempotente: se puede correr
 * varias veces, no duplica (usa el slug como clave).
 *
 *   npx tsx --env-file=.env.local scripts/seed-mock-products.ts
 *
 * Para limpiar los mocks:
 *   npx tsx --env-file=.env.local scripts/seed-mock-products.ts --reset
 */

import { inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, products, productImages } from '@/lib/db/schemas'
import { allImportCategories } from '@/lib/catalog/categorization'
import type { ProductSpec } from '@/lib/db/schemas/products'

type MockProduct = {
  slug: string
  name: string
  description: string
  price: number // en centavos
  compareAtPrice?: number
  stock: number
  sku: string
  brand: string
  categorySlug: string
  specs: ProductSpec[]
  images: string[] // URLs HTTPS; vacío = usa placeholder
}

const img = (seed: string): string => `https://picsum.photos/seed/${seed}/600/600`

const MOCKS: MockProduct[] = [
  {
    slug: 'taladro-percutor-bosch-gsb-13-re',
    name: 'Taladro percutor Bosch GSB 13 RE 650W',
    description: 'Taladro percutor de 650W con mandril de 13mm, velocidad variable y reversa. Ideal para hormigón, metal y madera.',
    price: 8999900,
    compareAtPrice: 10999900,
    stock: 15,
    sku: 'BOSCH-GSB13RE',
    brand: 'Bosch',
    categorySlug: 'herramientas-electricas',
    specs: [
      { label: 'Potencia', value: '650 W' },
      { label: 'Mandril', value: '13 mm' },
      { label: 'Velocidad', value: '0-2800 rpm' },
    ],
    images: [img('taladro1'), img('taladro2')],
  },
  {
    slug: 'amoladora-angular-dewalt-dwe4120',
    name: 'Amoladora angular DeWalt DWE4120 4-1/2" 820W',
    description: 'Amoladora angular de 820W, disco de 115mm, con protección contra rearranque y guarda ajustable sin herramientas.',
    price: 7250000,
    stock: 8,
    sku: 'DEWALT-DWE4120',
    brand: 'DeWalt',
    categorySlug: 'herramientas-electricas',
    specs: [
      { label: 'Potencia', value: '820 W' },
      { label: 'Disco', value: '115 mm' },
    ],
    images: [img('amoladora1')],
  },
  {
    slug: 'martillo-carpintero-stanley-16oz',
    name: 'Martillo carpintero Stanley 16oz mango fibra',
    description: 'Martillo de uña con cabeza forjada de 16oz y mango de fibra de vidrio antivibración.',
    price: 1250000,
    stock: 40,
    sku: 'STANLEY-MC16',
    brand: 'Stanley',
    categorySlug: 'herramientas-manuales',
    specs: [
      { label: 'Peso', value: '16 oz' },
      { label: 'Mango', value: 'Fibra de vidrio' },
    ],
    images: [img('martillo1')],
  },
  {
    slug: 'juego-destornilladores-bahco-6pz',
    name: 'Juego de destornilladores Bahco 6 piezas',
    description: 'Set de 6 destornilladores (planos y Phillips) con mango ergonómico bimaterial y puntas magnetizadas.',
    price: 1899900,
    compareAtPrice: 2299900,
    stock: 22,
    sku: 'BAHCO-SET6',
    brand: 'Bahco',
    categorySlug: 'herramientas-manuales',
    specs: [{ label: 'Piezas', value: '6' }],
    images: [img('destornilladores1')],
  },
  {
    slug: 'llave-francesa-14-tramontina',
    name: 'Llave francesa 14" Tramontina',
    description: 'Llave ajustable de 14 pulgadas en acero cromo vanadio, con escala graduada y mordaza de apertura amplia.',
    price: 980000,
    stock: 0, // sin stock a propósito para testear el badge
    sku: 'TRAMONTINA-LF14',
    brand: 'Tramontina',
    categorySlug: 'herramientas-manuales',
    specs: [
      { label: 'Medida', value: '14"' },
      { label: 'Material', value: 'Cromo vanadio' },
    ],
    images: [],
  },
  {
    slug: 'caja-tornillos-autoperforantes-500u',
    name: 'Caja tornillos autoperforantes 6x1" x500u',
    description: 'Caja de 500 tornillos autoperforantes punta mecha 6x1", zincados, para chapa y perfilería.',
    price: 750000,
    stock: 120,
    sku: 'TORN-AP6X1-500',
    brand: 'Genérico',
    categorySlug: 'tornilleria',
    specs: [
      { label: 'Medida', value: '6 x 1"' },
      { label: 'Cantidad', value: '500 u' },
    ],
    images: [],
  },
  {
    slug: 'canilla-monocomando-fv-cocina',
    name: 'Canilla monocomando FV para cocina cromada',
    description: 'Grifería monocomando de cocina con pico alto giratorio 360°, cartucho cerámico y acabado cromado.',
    price: 4599900,
    compareAtPrice: 5499900,
    stock: 10,
    sku: 'FV-MONO-COC',
    brand: 'FV',
    categorySlug: 'plomeria',
    specs: [
      { label: 'Tipo', value: 'Monocomando' },
      { label: 'Acabado', value: 'Cromado' },
    ],
    images: [img('canilla1')],
  },
  {
    slug: 'cable-unipolar-25mm-rollo-100m',
    name: 'Cable unipolar 2.5mm² rollo 100m negro',
    description: 'Cable unipolar de cobre 2.5mm² normalizado IRAM, aislación PVC, rollo de 100 metros.',
    price: 6899900,
    stock: 6,
    sku: 'CABLE-25-100',
    brand: 'Prysmian',
    categorySlug: 'electricidad',
    specs: [
      { label: 'Sección', value: '2.5 mm²' },
      { label: 'Largo', value: '100 m' },
    ],
    images: [img('cable1')],
  },
  {
    slug: 'latex-interior-tersuave-20l',
    name: 'Látex interior Tersuave blanco 20 litros',
    description: 'Pintura látex interior lavable de alta cobertura, terminación mate, rendimiento hasta 12 m²/litro.',
    price: 5299900,
    compareAtPrice: 6199900,
    stock: 18,
    sku: 'TERSUAVE-LI20',
    brand: 'Tersuave',
    categorySlug: 'pintura',
    specs: [
      { label: 'Contenido', value: '20 L' },
      { label: 'Terminación', value: 'Mate' },
    ],
    images: [img('latex1'), img('latex2')],
  },
  {
    slug: 'cemento-loma-negra-50kg',
    name: 'Cemento Loma Negra CPN40 bolsa 50kg',
    description: 'Cemento Portland normal CPN40 en bolsa de 50kg para hormigón, mampostería y contrapisos.',
    price: 1350000,
    stock: 200,
    sku: 'LOMANEGRA-50',
    brand: 'Loma Negra',
    categorySlug: 'construccion',
    specs: [{ label: 'Peso', value: '50 kg' }],
    images: [img('cemento1')],
  },
  {
    slug: 'manguera-reforzada-15m-1-2',
    name: 'Manguera reforzada 1/2" x 15m con conectores',
    description: 'Manguera de riego reforzada de 3 capas, 1/2 pulgada, 15 metros, incluye conectores rápidos y lanza.',
    price: 1799900,
    stock: 25,
    sku: 'MANG-15-12',
    brand: 'Genérico',
    categorySlug: 'jardin',
    specs: [
      { label: 'Diámetro', value: '1/2"' },
      { label: 'Largo', value: '15 m' },
    ],
    images: [img('manguera1')],
  },
  {
    slug: 'candado-trabex-50mm-arco-largo',
    name: 'Candado Trabex 50mm arco largo con 3 llaves',
    description: 'Candado de bronce macizo 50mm con arco largo endurecido y 3 llaves. Resistente a la intemperie.',
    price: 890000,
    stock: 35,
    sku: 'TRABEX-50AL',
    brand: 'Trabex',
    categorySlug: 'seguridad',
    specs: [
      { label: 'Ancho', value: '50 mm' },
      { label: 'Arco', value: 'Largo' },
    ],
    images: [img('candado1')],
  },
]

async function reset(): Promise<void> {
  const slugs = MOCKS.map((m) => m.slug)
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.slug, slugs))
  const ids = rows.map((r) => r.id)
  if (ids.length > 0) {
    // product_images tiene onDelete cascade, se borran solas
    await db.delete(products).where(inArray(products.id, ids))
  }
  console.log(`Reset: ${ids.length} productos mock eliminados.`)
}

async function seed(): Promise<void> {
  // 1. Asegurar categorías (mismas que la importación real)
  const catRows = allImportCategories()
  for (let i = 0; i < catRows.length; i++) {
    const cat = catRows[i]
    if (!cat) continue
    await db
      .insert(categories)
      .values({ slug: cat.slug, name: cat.name, order: i })
      .onConflictDoNothing({ target: categories.slug })
  }
  const catList = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
  const catBySlug = new Map(catList.map((c) => [c.slug, c.id]))

  // 2. Insertar productos (idempotente por slug)
  let created = 0
  let skipped = 0
  for (const m of MOCKS) {
    const categoryId = catBySlug.get(m.categorySlug) ?? null
    const inserted = await db
      .insert(products)
      .values({
        slug: m.slug,
        name: m.name,
        description: m.description,
        price: m.price,
        ...(m.compareAtPrice !== undefined ? { compareAtPrice: m.compareAtPrice } : {}),
        stock: m.stock,
        sku: m.sku,
        brand: m.brand,
        specs: m.specs,
        active: true,
        ...(categoryId ? { categoryId } : {}),
      })
      .onConflictDoNothing({ target: products.slug })
      .returning({ id: products.id })

    const productId = inserted[0]?.id
    if (!productId) {
      skipped++
      continue
    }
    created++

    // 3. Imágenes del producto recién creado
    if (m.images.length > 0) {
      await db.insert(productImages).values(
        m.images.map((url, index) => ({
          productId,
          url,
          alt: m.name,
          order: index,
          isPrimary: index === 0,
        })),
      )
    }
  }

  console.log(`Seed mock: ${created} productos creados, ${skipped} ya existían.`)
}

async function main(): Promise<void> {
  if (process.argv.includes('--reset')) {
    await reset()
  } else {
    await seed()
  }
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error('Error en seed de mocks:', error)
  process.exit(1)
})
