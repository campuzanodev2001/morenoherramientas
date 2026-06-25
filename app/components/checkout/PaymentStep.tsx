'use client'

import type { BuyerState, AddressState } from '@/lib/checkout/useCheckoutState'
import type { ShippingOptionView } from './ShippingSelector'
import type { CartLineInput } from '@/lib/validations/checkout'

export type PaymentStepProps = {
  buyer: BuyerState
  address: AddressState
  shipping: ShippingOptionView | null
  items: CartLineInput[]
  total: number
  onBack: () => void
  onPaid: () => void
}

/**
 * Pantalla de pago: revisión de datos + medios de pago. En CHECKOUT-01 muestra
 * la revisión; el Brick de MercadoPago se monta en PAY-02.
 */
export default function PaymentStep({ buyer, address, shipping, onBack }: PaymentStepProps) {
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

      <div
        id="payment-brick-container"
        className="border-2 border-dashed border-outline p-6 text-center text-sm font-medium text-on-surface-variant"
      >
        Medios de pago de Mercado Pago.
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="border-2 border-charcoal text-on-surface font-black uppercase tracking-widest py-3 px-6 text-sm hover:bg-charcoal hover:text-on-primary transition-colors"
        >
          Atrás
        </button>
      </div>
    </section>
  )
}
