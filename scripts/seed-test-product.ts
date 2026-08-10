/**
 * Crea un único producto de prueba a $0 para recorrer el flujo de checkout
 * de punta a punta (carrito → envío → preferencia de MP → webhook) sin gastar
 * plata real. Idempotente: usa el slug como clave, se puede correr de nuevo.
 *
 *   npx tsx --env-file=.env.local scripts/seed-test-product.ts
 *
 * Para sacarlo del storefront cuando terminen las pruebas (soft delete, no
 * rompe las órdenes que lo referencien):
 *   npx tsx --env-file=.env.local scripts/seed-test-product.ts --reset
 *
 * OJO: mientras esté activo es visible y comprable en la tienda pública.
 */

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schemas'
import type { NewProduct } from '@/lib/db/types'

const SLUG = 'objeto-de-prueba-1'

const TEST_PRODUCT: NewProduct = {
  slug: SLUG,
  name: 'Objeto de prueba 1',
  description:
    'Producto de prueba para verificar el flujo de compra. No es un artículo real del catálogo.',
  price: 0, // centavos
  stock: 999,
  sku: 'TEST-001',
  brand: null,
  specs: [],
  active: true,
  // Sin categoría a propósito: no se cuela en las categorías reales del catálogo.
  categoryId: null,
}

async function seed(): Promise<void> {
  const inserted = await db
    .insert(products)
    .values(TEST_PRODUCT)
    .onConflictDoNothing({ target: products.slug })
    .returning({ id: products.id })

  if (inserted[0]) {
    console.log(`Creado: ${TEST_PRODUCT.name} (${inserted[0].id}) — /producto/${SLUG}`)
    return
  }

  // Ya existía: lo revive por si una corrida anterior lo dio de baja.
  const [updated] = await db
    .update(products)
    .set({ price: TEST_PRODUCT.price, stock: TEST_PRODUCT.stock, active: true, deletedAt: null })
    .where(eq(products.slug, SLUG))
    .returning({ id: products.id })

  console.log(`Ya existía, reactivado: ${updated?.id ?? '?'} — /producto/${SLUG}`)
}

async function reset(): Promise<void> {
  const [row] = await db
    .update(products)
    .set({ active: false, deletedAt: new Date() })
    .where(eq(products.slug, SLUG))
    .returning({ id: products.id })

  console.log(row ? `Dado de baja: ${row.id}` : 'No existía el producto de prueba.')
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
  console.error('Error en seed del producto de prueba:', error)
  process.exit(1)
})
