import { pgEnum } from 'drizzle-orm/pg-core'

export const userRole = pgEnum('user_role', ['customer', 'admin'])

/**
 * Los banners de mobile y desktop son piezas distintas, no la misma imagen
 * recortada: cambian de proporción (3:4 vs 16:9) y de composición.
 */
export const bannerDevice = pgEnum('banner_device', ['mobile', 'desktop'])

export const orderStatus = pgEnum('order_status', [
  'pending', // creada, esperando pago
  'confirmed', // pago aprobado
  'processing', // el negocio prepara el pedido
  'shipped', // despachado
  'delivered', // entregado
  'cancelled', // cancelado
  'refunded', // reembolsado
])
