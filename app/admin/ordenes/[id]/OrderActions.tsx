'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  markAsProcessing,
  markAsShipped,
  markAsDelivered,
  cancelOrder,
  confirmTransferPayment,
} from '@/lib/admin/order-actions'
import type { OrderStatus } from '@/lib/db/types'

type Result = { success: true } | { success: false; error: string }

const CONFIRM_COPY = {
  ship: {
    title: '¿Marcar como enviada?',
    body: 'Se notificará al cliente con el número de seguimiento.',
  },
  cancel: {
    title: '¿Cancelar esta orden?',
    body: 'Esta acción no se puede deshacer.',
  },
  transfer: {
    title: '¿Confirmar la transferencia?',
    body: 'Verificá el dinero en la cuenta antes de confirmar: se descuenta el stock y se le avisa al cliente que el pago está aprobado. No se puede deshacer.',
  },
} as const

export default function OrderActions({
  orderId,
  status,
  mpApproved,
  isTransfer,
}: {
  orderId: string
  status: OrderStatus
  mpApproved: boolean
  /** Órdenes por transferencia: no hay webhook, las confirma el admin a mano. */
  isTransfer: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [tracking, setTracking] = useState('')
  const [carrier, setCarrier] = useState('')
  const [confirm, setConfirm] = useState<null | 'ship' | 'cancel' | 'transfer'>(null)

  function run(action: () => Promise<Result>) {
    setError(null)
    startTransition(async () => {
      const res = await action()
      if (res.success) {
        setConfirm(null)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  const btn =
    'font-black uppercase tracking-widest py-2.5 px-5 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  const canCancel = (status === 'pending' || status === 'confirmed') && !mpApproved

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm font-bold text-accent-red">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {isTransfer && status === 'pending' && (
          <button
            onClick={() => setConfirm('transfer')}
            disabled={pending}
            className={`${btn} bg-emerald-700 text-on-primary hover:bg-emerald-800`}
          >
            Confirmar transferencia recibida
          </button>
        )}

        {status === 'confirmed' && (
          <button
            onClick={() => run(() => markAsProcessing(orderId))}
            disabled={pending}
            className={`${btn} bg-primary-container text-on-primary hover:bg-primary`}
          >
            Marcar en preparación
          </button>
        )}

        {status === 'shipped' && (
          <button
            onClick={() => run(() => markAsDelivered(orderId))}
            disabled={pending}
            className={`${btn} bg-primary-container text-on-primary hover:bg-primary`}
          >
            Marcar como entregada
          </button>
        )}

        {canCancel && (
          <button
            onClick={() => setConfirm('cancel')}
            disabled={pending}
            className={`${btn} border-2 border-accent-red text-accent-red hover:bg-accent-red hover:text-on-primary`}
          >
            Cancelar orden
          </button>
        )}
      </div>

      {/* Marcar como enviada: requiere tracking + carrier */}
      {status === 'processing' && (
        <div className="flex flex-col gap-2 border-2 border-outline p-4">
          <span className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
            Marcar como enviada
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Nº de seguimiento"
              className="flex-1 border-2 border-outline px-3 py-2 text-sm bg-surface focus:outline-none focus:border-primary-container"
            />
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="Carrier"
              className="flex-1 border-2 border-outline px-3 py-2 text-sm bg-surface focus:outline-none focus:border-primary-container"
            />
          </div>
          <button
            onClick={() => setConfirm('ship')}
            disabled={pending || !tracking.trim() || !carrier.trim()}
            className={`${btn} self-start bg-primary-container text-on-primary hover:bg-primary`}
          >
            Marcar como enviada
          </button>
        </div>
      )}

      {/* Confirmación de acciones irreversibles */}
      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest border-2 border-charcoal p-6 max-w-sm w-full flex flex-col gap-4">
            <p className="font-black uppercase text-on-surface">{CONFIRM_COPY[confirm].title}</p>
            <p className="text-sm text-on-surface-variant">{CONFIRM_COPY[confirm].body}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirm(null)}
                disabled={pending}
                className={`${btn} border-2 border-charcoal text-on-surface`}
              >
                Volver
              </button>
              <button
                onClick={() =>
                  run(() => {
                    if (confirm === 'ship') return markAsShipped(orderId, tracking, carrier)
                    if (confirm === 'transfer') return confirmTransferPayment(orderId)
                    return cancelOrder(orderId)
                  })
                }
                disabled={pending}
                className={`${btn} ${
                  confirm === 'cancel'
                    ? 'bg-accent-red text-on-primary'
                    : confirm === 'transfer'
                      ? 'bg-emerald-700 text-on-primary'
                      : 'bg-primary-container text-on-primary'
                }`}
              >
                {pending ? 'Procesando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
