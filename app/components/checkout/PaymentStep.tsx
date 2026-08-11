'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BuyerState, AddressState } from '@/lib/checkout/useCheckoutState'
import type { ShippingOptionView } from './ShippingSelector'
import type { CartLineInput, PaymentMethod } from '@/lib/validations/checkout'
import { formatPrice } from '@/lib/catalog/format'
import { TRANSFER_DISCOUNT } from '@/lib/catalog/pricing'
import PaymentBricks from './PaymentBricks'

export type PaymentStepProps = {
  buyer: BuyerState
  address: AddressState
  shipping: ShippingOptionView | null
  items: CartLineInput[]
  total: number
  /** Subtotal de productos, para mostrar cuánto se ahorra con transferencia. */
  subtotal: number
  method: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
  /** El negocio tiene cuenta bancaria cargada (ver lib/payments/transfer.ts). */
  transferEnabled: boolean
  onBack: () => void
  /** La orden ya existe y el Brick va a montarse: el checkout no debe redirigir. */
  onPreferenceCreated: () => void
}

type Status = 'choosing' | 'creating' | 'ready' | 'error'

const DISCOUNT_LABEL = `${Math.round(TRANSFER_DISCOUNT * 100)}%`

function MethodOption({
  value,
  selected,
  onSelect,
  icon,
  title,
  description,
  highlight,
}: {
  value: PaymentMethod
  selected: boolean
  onSelect: (value: PaymentMethod) => void
  icon: string
  title: string
  description: string
  highlight?: string
}) {
  return (
    <label
      className={`flex items-start gap-3 border-2 p-4 cursor-pointer transition-colors ${
        selected
          ? 'border-accent-red bg-accent-red/5'
          : 'border-outline hover:border-charcoal bg-surface-container-lowest'
      }`}
    >
      <input
        type="radio"
        name="paymentMethod"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        className={`material-symbols-outlined shrink-0 ${
          selected ? 'text-accent-red' : 'text-on-surface-variant'
        }`}
      >
        {icon}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="font-black uppercase tracking-wide text-sm text-on-surface">{title}</span>
        <span className="text-xs font-medium text-on-surface-variant">{description}</span>
        {highlight && <span className="text-xs font-black text-emerald-700 mt-1">{highlight}</span>}
      </span>
    </label>
  )
}

/**
 * Pantalla de pago: elección del medio, creación de la orden y —solo para
 * MercadoPago— montaje del Payment Brick.
 *
 * La orden se crea recién al confirmar el medio de pago, porque el medio
 * cambia el total: transferencia lleva descuento (TRANSFER_DISCOUNT) y el
 * servidor lo recalcula al crearla.
 *
 * Con transferencia no hay nada que cobrar acá: la orden queda en `pending` y
 * se manda al comprador a la página de la orden, que muestra el CBU. La
 * confirma un admin cuando verifica el dinero.
 *
 * Con MercadoPago el Brick tokeniza la tarjeta en el browser: los datos de la
 * tarjeta nunca pasan por nuestro servidor. Llegar al paso 4 y abandonar deja
 * una orden en `pending`; las barre el cron de órdenes viejas
 * (`cancelStalePendingOrders`).
 */
export default function PaymentStep({
  buyer,
  address,
  shipping,
  items,
  subtotal,
  method,
  onMethodChange,
  transferEnabled,
  onBack,
  onPreferenceCreated,
}: PaymentStepProps) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('choosing')
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<{ id: string; total: number } | null>(null)

  const transferSavings = Math.round(subtotal * TRANSFER_DISCOUNT)

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
          paymentMethod: method,
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

      if (method === 'transfer') {
        // No hay cobro que hacer: los datos bancarios están en la orden.
        router.push(`/orden/${data.orderId}`)
        return
      }
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

      {status === 'choosing' && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
            ¿Cómo querés pagar?
          </span>
          <MethodOption
            value="mercadopago"
            selected={method === 'mercadopago'}
            onSelect={onMethodChange}
            icon="credit_card"
            title="Tarjeta o Mercado Pago"
            description="Crédito, débito, dinero en cuenta o cuotas sin tarjeta."
          />
          {transferEnabled && (
            <MethodOption
              value="transfer"
              selected={method === 'transfer'}
              onSelect={onMethodChange}
              icon="account_balance"
              title="Transferencia bancaria"
              description="Te damos el CBU y confirmamos el pedido al recibir el comprobante."
              highlight={`${DISCOUNT_LABEL} OFF — ahorrás ${formatPrice(transferSavings)}`}
            />
          )}
          <div className="flex gap-3 pt-1">
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
              {method === 'transfer' ? 'Ver datos para transferir' : 'Continuar al pago'}
            </button>
          </div>
        </div>
      )}

      {status === 'ready' && order && (
        <PaymentBricks
          orderId={order.id}
          totalCents={order.total}
          payerEmail={buyer.email}
          // El estado definitivo lo escribe el webhook; la página de la orden
          // muestra "procesando" hasta que llegue.
          onResolved={() => router.push(`/orden/${order.id}`)}
        />
      )}

      {status === 'error' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-accent-red border-2 border-accent-red/40 bg-accent-red/5 p-3">
            {error}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus('choosing')}
              className="border-2 border-charcoal text-on-surface font-black uppercase tracking-widest py-3 px-6 text-sm hover:bg-charcoal hover:text-on-primary transition-colors"
            >
              Cambiar medio de pago
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
      )}

      {status === 'creating' && (
        // Preparando el pago: skeleton, nunca un spinner suelto.
        <div className="flex flex-col gap-3" aria-busy="true">
          <div className="h-64 w-full animate-pulse bg-surface-container border-2 border-outline" />
        </div>
      )}
    </section>
  )
}
