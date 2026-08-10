'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  /** La orden ya existe y el Brick va a montarse: el checkout no debe redirigir. */
  onPreferenceCreated: () => void
}

type Status = 'idle' | 'creating' | 'ready' | 'error'

/**
 * Pantalla de pago: revisión de datos, creación de la orden y montaje del
 * Payment Brick (formulario de tarjeta embebido).
 *
 * La orden se crea sola al entrar al paso, así el comprador ve el formulario
 * de tarjeta sin un click intermedio. El costo de esto es que llegar al paso 4
 * y abandonar deja una orden en `pending`; las barre el cron de órdenes viejas
 * (`cancelStalePendingOrders`).
 *
 * El Brick tokeniza la tarjeta en el browser: los datos de la tarjeta nunca
 * pasan por nuestro servidor.
 */
export default function PaymentStep({
  buyer,
  address,
  shipping,
  items,
  onBack,
  onPreferenceCreated,
}: PaymentStepProps) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<{ id: string; total: number } | null>(null)

  // Guard contra el doble montaje de StrictMode en dev: sin esto se crearían
  // dos órdenes por cada visita al paso.
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !shipping) return
    started.current = true
    void startPayment()
    // startPayment sólo depende de props estables en este punto del flujo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipping])

  async function startPayment() {
    if (!shipping) return
    setStatus('creating')
    setError(null)
    try {
      const res = await fetch('/api/checkout/create-order', {
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
        | { orderId: string; total: number }
        | { error: { message: string } }
      if (!res.ok || !('orderId' in data)) {
        const message = 'error' in data ? data.error.message : 'No pudimos iniciar el pago.'
        setError(message)
        setStatus('error')
        return
      }
      // El carrito NO se vacía acá: el comprador todavía no pagó. Se vacía al
      // llegar a la página de la orden (ver OrderCleanup).
      onPreferenceCreated()
      setOrder({ id: data.orderId, total: data.total })
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
              {shipping.service}
              {shipping.estimatedDays > 0 ? ` · ${shipping.estimatedDays} días aprox.` : ''}
            </span>
          )}
        </div>
      </div>

      {status === 'ready' && order ? (
        <PaymentBricks
          orderId={order.id}
          totalCents={order.total}
          payerEmail={buyer.email}
          // El estado definitivo lo escribe el webhook; la página de la orden
          // muestra "procesando" hasta que llegue.
          onResolved={() => router.push(`/orden/${order.id}`)}
        />
      ) : status === 'error' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-accent-red border-2 border-accent-red/40 bg-accent-red/5 p-3">
            {error}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="border-2 border-charcoal text-on-surface font-black uppercase tracking-widest py-3 px-6 text-sm hover:bg-charcoal hover:text-on-primary transition-colors"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={startPayment}
              disabled={!shipping}
              className="bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-6 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        // Preparando el pago: skeleton, nunca un spinner suelto.
        <div className="flex flex-col gap-3" aria-busy="true">
          <div className="h-64 w-full animate-pulse bg-surface-container border-2 border-outline" />
          <button
            type="button"
            onClick={onBack}
            className="self-start border-2 border-charcoal text-on-surface font-black uppercase tracking-widest py-3 px-6 text-sm hover:bg-charcoal hover:text-on-primary transition-colors"
          >
            Atrás
          </button>
        </div>
      )}
    </section>
  )
}
