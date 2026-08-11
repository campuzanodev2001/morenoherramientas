import { pgEnum } from 'drizzle-orm/pg-core'

export const userRole = pgEnum('user_role', ['customer', 'admin'])

/**
 * Los banners de mobile y desktop son piezas distintas, no la misma imagen
 * recortada: cambian de proporción (3:4 vs 16:9) y de composición.
 */
export const bannerDevice = pgEnum('banner_device', ['mobile', 'desktop'])

/**
 * Cómo paga el comprador. `transfer` no pasa por MercadoPago: la orden queda
 * en `pending` hasta que un admin verifica la transferencia y la confirma.
 */
export const paymentMethodEnum = pgEnum('payment_method', ['mercadopago', 'transfer'])

export const orderStatus = pgEnum('order_status', [
  'pending', // creada, esperando pago
  'confirmed', // pago aprobado
  'processing', // el negocio prepara el pedido
  'shipped', // despachado
  'delivered', // entregado
  'cancelled', // cancelado
  'refunded', // reembolsado
])
