'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/helpers'
import {
  addToCart,
  clearCart,
  getCartForClient,
  mergeAnonymousCart,
  removeCartProduct,
  setCartProductQuantity,
  type CartClientView,
} from '@/lib/db/queries/cart'
import { handleServerActionError, type ServerActionError } from '@/lib/errors/handlers'

/** Nombre de la cookie que espeja el carrito anónimo para el merge al loguearse. */
const ANON_CART_COOKIE = 'anon_cart'

type Ok = { success: true }
type ActionResult = Ok | ServerActionError
type CartResult = (Ok & { cart: CartClientView }) | ServerActionError

const uuid = z.string().uuid()
const qtySchema = z.number().int().positive().max(999)

const anonCartSchema = z.array(
  z.object({ productId: z.string().uuid(), quantity: z.number().int().positive().max(999) }),
)

/** Lee el carrito del usuario logueado con los datos actuales de la DB. */
export async function getCartAction(): Promise<CartResult> {
  try {
    const session = await requireAuth()
    const cart = await getCartForClient(session.user.id)
    return { success: true, cart }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function addToCartAction(
  productId: string,
  quantity = 1,
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const pid = uuid.parse(productId)
    const qty = qtySchema.parse(quantity)
    await addToCart(session.user.id, pid, qty)
    revalidatePath('/carrito')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function setCartItemAction(
  productId: string,
  quantity: number,
): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const pid = uuid.parse(productId)
    const qty = z.number().int().min(0).max(999).parse(quantity)
    await setCartProductQuantity(session.user.id, pid, qty)
    revalidatePath('/carrito')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function removeCartItemAction(productId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const pid = uuid.parse(productId)
    await removeCartProduct(session.user.id, pid)
    revalidatePath('/carrito')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

export async function clearCartAction(): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    await clearCart(session.user.id)
    revalidatePath('/carrito')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

/**
 * Merge del carrito anónimo (leído de la cookie) al carrito del usuario en DB.
 * Suma cantidades, capa al stock y limpia la cookie. Devuelve el carrito ya
 * mergeado para que el cliente reemplace su estado local.
 */
export async function mergeAnonymousCartAction(): Promise<CartResult> {
  try {
    const session = await requireAuth()
    const jar = await cookies()
    const raw = jar.get(ANON_CART_COOKIE)?.value

    if (raw) {
      const parsed = anonCartSchema.safeParse(JSON.parse(raw))
      if (parsed.success && parsed.data.length > 0) {
        await mergeAnonymousCart(session.user.id, parsed.data)
      }
      jar.delete(ANON_CART_COOKIE)
    }

    const cart = await getCartForClient(session.user.id)
    revalidatePath('/carrito')
    return { success: true, cart }
  } catch (error) {
    return handleServerActionError(error)
  }
}
