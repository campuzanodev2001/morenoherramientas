import { env } from '@/lib/env'
import { TRANSFER_DISCOUNT } from '@/lib/catalog/pricing'

/** Datos que el comprador necesita para transferir. Todos públicos. */
export type TransferAccount = {
  bankName: string
  accountHolder: string
  cbu: string
  alias: string
  cuit: string | null
}

/**
 * Cuenta de destino, o null si el método no está configurado.
 *
 * El checkout usa este null como interruptor: sin CBU no hay adónde
 * transferir, así que la opción directamente no se ofrece en vez de mostrar
 * un formulario que termina en una orden que nadie puede pagar.
 */
export function getTransferAccount(): TransferAccount | null {
  const bankName = env.TRANSFER_BANK_NAME
  const accountHolder = env.TRANSFER_ACCOUNT_HOLDER
  const cbu = env.TRANSFER_CBU
  const alias = env.TRANSFER_ALIAS
  if (!bankName || !accountHolder || !cbu || !alias) return null
  return { bankName, accountHolder, cbu, alias, cuit: env.TRANSFER_CUIT ?? null }
}

export function isTransferEnabled(): boolean {
  return getTransferAccount() !== null
}

/**
 * Descuento en centavos sobre el subtotal. Solo aplica a los productos: el
 * envío lo cobra el correo y no se descuenta.
 */
export function transferDiscount(subtotal: number): number {
  return Math.round(subtotal * TRANSFER_DISCOUNT)
}
