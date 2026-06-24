import { pgEnum } from 'drizzle-orm/pg-core'

export const userRole = pgEnum('user_role', ['customer', 'admin'])

export const orderStatus = pgEnum('order_status', [
  'pending', // creada, esperando pago
  'confirmed', // pago aprobado
  'processing', // el negocio prepara el pedido
  'shipped', // despachado
  'delivered', // entregado
  'cancelled', // cancelado
  'refunded', // reembolsado
])
