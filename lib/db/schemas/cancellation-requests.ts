import { pgTable, text, uuid, index } from 'drizzle-orm/pg-core'
import { orders } from './orders'
import { cancellationStatus } from './enums'
import { pk, createdAt, updatedAt } from './_helpers'

/**
 * Pedidos de arrepentimiento (botón de arrepentimiento, Res. 424/2020 SCI).
 *
 * El comprador tiene 10 días corridos desde la entrega para cancelar sin dar
 * motivo. La ley exige que el pedido se pueda hacer desde la web, así que se
 * registra acá y se le avisa al admin por mail.
 *
 * NO cancela la orden automáticamente: cambiar el estado de una orden mueve
 * stock y plata, y con transferencia hay que devolver el dinero a mano. El
 * admin resuelve desde /admin/arrepentimientos.
 *
 * `orderId` puede ser null: alguien puede pedir la cancelación con un número
 * de orden que tipeó mal, y ese pedido igual hay que registrarlo y responderlo.
 */
export const cancellationRequests = pgTable(
  'cancellation_requests',
  {
    id: pk(),
    orderId: uuid('order_id').references(() => orders.id),
    /** Lo que tipeó el comprador, tal cual. Se guarda aunque no matchee ninguna orden. */
    orderNumber: text('order_number').notNull(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    /** Opcional: la ley NO exige justificar el arrepentimiento. */
    reason: text('reason'),
    status: cancellationStatus('status').default('pending').notNull(),
    /** Nota interna del admin al resolver. Nunca se le muestra al comprador. */
    adminNote: text('admin_note'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('cancellation_requests_status_idx').on(table.status),
    index('cancellation_requests_created_at_idx').on(table.createdAt),
  ],
)
