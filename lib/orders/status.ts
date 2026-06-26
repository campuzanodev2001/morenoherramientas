import type { OrderStatus } from '@/lib/db/types'

/** Etiqueta legible + clases del badge por estado de orden. */
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Pendiente', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  confirmed: { label: 'Confirmada', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  processing: { label: 'En preparación', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  shipped: { label: 'Enviada', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' },
  delivered: { label: 'Entregada', badgeClass: 'bg-green-100 text-green-800 border-green-300' },
  cancelled: { label: 'Cancelada', badgeClass: 'bg-red-100 text-red-800 border-red-300' },
  refunded: { label: 'Reembolsada', badgeClass: 'bg-gray-100 text-gray-700 border-gray-300' },
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_META[status].label
}
