'use client'

import { useState } from 'react'
import type { BuyerState, AddressState } from '@/lib/checkout/useCheckoutState'
import type { ShippingOptionView } from './ShippingSelector'
import type { CartLineInput } from '@/lib/validations/checkout'
import PaymentBricks from './PaymentBricks'

export type PaymentStepProps = {
  buyer: BuyerState
  address: AddressState
  shipping: ShippingOptionView | null
  items: CartLineInput[]
  total: number
  onBack: () => void
  onPaid: () => void
}

type Status = 'idle' | 'creating' | 'ready' | 'error'

/**
 * Pantalla de pago: revisión de datos + creación de la preferencia y montaje
 * del Brick de MercadoPago (PAY-02). La preferencia se crea recién al hacer
 * click en "Ir a pagar" para no generar órdenes pending de más.
 */
export default function PaymentStep({ buyer, address, shipping, items, onBack, onPaid }: PaymentStepProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)

  async function startPayment() {
    if (!shipping) return
    setStatus('creating')
    setError(null)
    try {
      const res = await fetch('/api/checkout/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer,
          shippingAddress: { ...address, country: 'AR' },
          shippingQuoteId: shipping.id,
          items,
        }),
      })
      const data = (await res.json()) as
        | { preferenceId: string; orderId: string; total: number }
        | { error: { message: string } }
      if (!res.ok || !('preferenceId' in data)) {
        const message = 'error' in data ? data.error.message : 'No pudimos iniciar el pago.'
        setError(message)
        setStatus('error')
        return
      }
      // El checkout se completó: limpiar estado local antes de pagar en MP.
      onPaid()
      setPreferenceId(data.preferenceId)
      setStatus('ready')
    } catch {
      setError('No pudimos iniciar el pago. Intentá de nuevo.')
      setStatus('error')
    }
  }

  return (
    <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-5">
      <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-3">
        Pago
      </h2>

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
            Comprador
          </span>
          <span className="font-bold text-on-surface">{buyer.name}</span>
          <span className="text-on-surface-variant">{buyer.email}</span>
          <span className="text-on-surface-variant">{buyer.phone}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
            Envío
          </span>
          <span className="font-bold text-on-surface">
            {address.street} {address.number}
            {address.floor ? `, ${address.floor}` : ''}
          </span>
          <span className="text-on-surface-variant">
            {address.city}, {address.province} (CP {address.postalCode})
          </span>
          {shipping && (
            <span className="text-on-surface-variant">
              {shipping.service} · {shipping.estimatedDays} días aprox.
            </span>
          )}
        </div>
      </div>

      {status === 'ready' && preferenceId ? (
        <PaymentBricks preferenceId={preferenceId} />
      ) : (
        <div className="flex flex-col gap-3">
          {error && (
            <p className="text-sm font-bold text-accent-red border-2 border-accent-red/40 bg-accent-red/5 p-3">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={status === 'creating'}
              className="border-2 border-charcoal text-on-surface font-black uppercase tracking-widest py-3 px-6 text-sm hover:bg-charcoal hover:text-on-primary transition-colors disabled:opacity-40"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={startPayment}
              disabled={!shipping || status === 'creating'}
              className="bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-6 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {status === 'creating' && (
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              )}
              {status === 'creating' ? 'Iniciando…' : 'Ir a pagar'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
