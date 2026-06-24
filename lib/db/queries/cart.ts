import { and, eq, getTableColumns, sql } from 'drizzle-orm'
import { db, type DbOrTx } from '@/lib/db'
import { carts, cartItems, products } from '@/lib/db/schemas'
import type { Product } from '@/lib/db/types'
import { AuthorizationError, NotFoundError, ValidationError } from '@/lib/errors'

export type CartLine = {
  itemId: string
  quantity: number
  product: Product
  lineSubtotal: number // en centavos
}

export type CartView = {
  cartId: string
  items: CartLine[]
  subtotal: number
  count: number
}

async function getOrCreateCart(userId: string, executor: DbOrTx = db): Promise<string> {
  const [existing] = await executor
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1)
  if (existing) return existing.id

  const [created] = await executor
    .insert(carts)
    .values({ userId })
    .onConflictDoNothing({ target: carts.userId })
    .returning({ id: carts.id })
  if (created) return created.id

  // Carrera: otro request lo creó entre el select y el insert.
  const [row] = await executor
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1)
  if (!row) throw new NotFoundError('No se pudo crear el carrito', 'CART_CREATE_FAILED')
  return row.id
}

async function requireProduct(productId: string): Promise<Product> {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
  if (!product || !product.active || product.deletedAt) {
    throw new NotFoundError('Producto no disponible', 'PRODUCT_UNAVAILABLE')
  }
  return product
}

/** Carrito del usuario con los datos ACTUALES del producto. */
export async function getCart(userId: string): Promise<CartView> {
  const cartId = await getOrCreateCart(userId)
  const rows = await db
    .select({ itemId: cartItems.id, quantity: cartItems.quantity, product: getTableColumns(products) })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(cartItems.addedAt)

  const items: CartLine[] = rows.map((r) => ({
    itemId: r.itemId,
    quantity: r.quantity,
    product: r.product,
    lineSubtotal: r.product.price * r.quantity,
  }))

  return {
    cartId,
    items,
    subtotal: items.reduce((acc, it) => acc + it.lineSubtotal, 0),
    count: items.reduce((acc, it) => acc + it.quantity, 0),
  }
}

async function currentQty(cartId: string, productId: string): Promise<number> {
  const [row] = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
    .limit(1)
  return row?.quantity ?? 0
}

/** Agrega unidades sumando a las existentes, sin exceder el stock disponible. */
export async function addToCart(userId: string, productId: string, quantity: number): Promise<void> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ValidationError([{ field: 'quantity', message: 'Cantidad inválida' }])
  }
  const product = await requireProduct(productId)
  const cartId = await getOrCreateCart(userId)
  const desired = (await currentQty(cartId, productId)) + quantity
  if (desired > product.stock) {
    throw new ValidationError([
      { field: 'quantity', message: `Solo quedan ${product.stock} unidades disponibles` },
    ])
  }

  await db
    .insert(cartItems)
    .values({ cartId, productId, quantity })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: { quantity: sql`${cartItems.quantity} + ${quantity}` },
    })
}

async function requireOwnedItem(
  userId: string,
  itemId: string,
): Promise<{ cartId: string; productId: string }> {
  const [row] = await db
    .select({ cartId: cartItems.cartId, productId: cartItems.productId, ownerId: carts.userId })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .where(eq(cartItems.id, itemId))
    .limit(1)
  if (!row) throw new NotFoundError('Item no encontrado', 'CART_ITEM_NOT_FOUND')
  if (row.ownerId !== userId) throw new AuthorizationError()
  return { cartId: row.cartId, productId: row.productId }
}

/** Fija la cantidad de un item (validando ownership y stock). */
export async function updateCartItem(userId: string, itemId: string, quantity: number): Promise<void> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ValidationError([{ field: 'quantity', message: 'Cantidad inválida' }])
  }
  const { productId } = await requireOwnedItem(userId, itemId)
  const product = await requireProduct(productId)
  if (quantity > product.stock) {
    throw new ValidationError([
      { field: 'quantity', message: `Solo quedan ${product.stock} unidades disponibles` },
    ])
  }
  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId))
}

export async function removeCartItem(userId: string, itemId: string): Promise<void> {
  await requireOwnedItem(userId, itemId)
  await db.delete(cartItems).where(eq(cartItems.id, itemId))
}

export async function clearCart(userId: string): Promise<void> {
  const cartId = await getOrCreateCart(userId)
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId))
}

export type AnonymousCartItem = { productId: string; quantity: number }

/**
 * Merge del carrito anónimo al loguearse: suma cantidades duplicadas, sin
 * exceder el stock. Ignora productos que ya no existen o están inactivos.
 */
export async function mergeAnonymousCart(
  userId: string,
  items: AnonymousCartItem[],
): Promise<void> {
  if (items.length === 0) return
  const cartId = await getOrCreateCart(userId)

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) continue
    const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1)
    if (!product || !product.active || product.deletedAt) continue

    const desired = (await currentQty(cartId, item.productId)) + item.quantity
    const capped = Math.min(desired, product.stock)
    if (capped <= 0) continue

    await db
      .insert(cartItems)
      .values({ cartId, productId: item.productId, quantity: capped })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: { quantity: capped },
      })
  }
}
