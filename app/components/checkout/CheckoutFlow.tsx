'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { z } from 'zod'
import { useCart } from '@/app/context/CartContext'
import { useCheckoutState } from '@/lib/checkout/useCheckoutState'
import { formatPrice } from '@/lib/catalog/format'
import { buyerSchema, shippingAddressSchema, type PaymentMethod } from '@/lib/validations/checkout'
import { TRANSFER_DISCOUNT } from '@/lib/catalog/pricing'
import Field from './Field'
import ShippingSelector from './ShippingSelector'
import PaymentStep from './PaymentStep'

const STEPS = [
  { label: 'Comprador', hint: 'Tus datos de contacto' },
  { label: 'Dirección', hint: 'A dónde lo enviamos' },
  { label: 'Envío', hint: 'Cómo y cuándo llega' },
  { label: 'Pago', hint: 'Tarjeta o transferencia' },
] as const

type Errors = Record<string, string>

function validate(schema: z.ZodTypeAny, value: unknown): Errors {
  const res = schema.safeParse(value)
  if (res.success) return {}
  const map: Errors = {}
  for (const issue of res.error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in map)) map[key] = issue.message
  }
  return map
}

export default function CheckoutFlow({ transferEnabled }: { transferEnabled: boolean }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, totalPrice, ready } = useCart()

  // El medio de pago vive acá y no en PaymentStep porque cambia el total que
  // muestra el resumen. El monto real lo recalcula igual el servidor.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago')

  // Una vez creada la preferencia el Brick queda montado y no hay que sacar al
  // comprador de la página, aunque el carrito cambie por debajo.
  const [paying, setPaying] = useState(false)

  // Carrito vacío (ya hidratado) → volver al carrito.
  useEffect(() => {
    if (ready && items.length === 0 && !paying) router.replace('/carrito')
  }, [ready, items.length, paying, router])

  const prefill = useMemo(
    () => ({ name: session?.user?.name ?? '', email: session?.user?.email ?? '' }),
    [session?.user?.name, session?.user?.email],
  )
  const { state, hydrated, setBuyer, setAddress, setShipping, setStep } = useCheckoutState(prefill)

  const [errors, setErrors] = useState<Errors>({})

  const cartLines = useMemo(
    () => items.map((it) => ({ productId: it.product.id, quantity: it.quantity })),
    [items],
  )

  // Esperar hidratación de carrito y checkout para no parpadear.
  if (!ready || !hydrated) {
    return <div className="h-64 animate-pulse bg-surface-container" aria-busy="true" />
  }

  if (items.length === 0 && !paying) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <p className="text-xl font-black uppercase text-on-surface-variant">
          No hay productos en el carrito
        </p>
        <Link
          href="/"
          className="border-2 border-primary-container text-primary-container font-black uppercase tracking-widest py-3 px-8 text-sm hover:bg-primary-container hover:text-on-primary transition-colors"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  const shippingCost = state.shipping?.price ?? 0
  // El descuento por transferencia aplica solo a los productos, no al envío.
  const discount = paymentMethod === 'transfer' ? Math.round(totalPrice * TRANSFER_DISCOUNT) : 0
  const total = totalPrice - discount + shippingCost

  // Un paso es alcanzable si todos los anteriores están completos. Los datos
  // ya cargados nunca se pierden: viven en el estado persistido del checkout.
  const buyerOk = buyerSchema.safeParse(state.buyer).success
  const addressOk = shippingAddressSchema.safeParse(state.address).success
  const reachable = (n: number) =>
    n === 1 ||
    (n === 2 && buyerOk) ||
    (n === 3 && buyerOk && addressOk) ||
    (n === 4 && buyerOk && addressOk && state.shipping !== null)

  function goToStep(target: number) {
    setErrors({})
    setStep(target)
  }

  function nextFromBuyer() {
    const errs = validate(buyerSchema, state.buyer)
    setErrors(errs)
    if (Object.keys(errs).length === 0) goToStep(2)
  }

  function nextFromAddress() {
    const errs = validate(shippingAddressSchema, state.address)
    setErrors(errs)
    if (Object.keys(errs).length === 0) goToStep(3)
  }

  function blurField(schema: z.ZodTypeAny, value: unknown, field: string) {
    const errs = validate(schema, value)
    setErrors((prev) => ({ ...prev, [field]: errs[field] ?? '' }))
  }

  return (
    <div className="grid md:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="flex flex-col gap-6">
        {/* Indicador de pasos */}
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STEPS.map(({ label, hint }, i) => {
            const n = i + 1
            const active = state.step === n
            const enabled = reachable(n)
            const done = enabled && !active && state.step > n
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => goToStep(n)}
                  disabled={!enabled}
                  aria-current={active ? 'step' : undefined}
                  className={`w-full h-full flex flex-col gap-1 items-start text-left border-t-4 pt-2 transition-colors ${
                    active
                      ? 'border-accent-red'
                      : enabled
                        ? 'border-primary-container hover:bg-surface-container'
                        : 'border-outline cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${
                      active
                        ? 'text-accent-red'
                        : enabled
                          ? 'text-primary-container'
                          : 'text-on-surface-variant/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base leading-none">
                      {done ? 'check_circle' : `counter_${n}`}
                    </span>
                    {label}
                  </span>
                  <span
                    className={`text-[11px] font-medium leading-tight ${
                      enabled ? 'text-on-surface-variant' : 'text-on-surface-variant/50'
                    }`}
                  >
                    {hint}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {/* Paso 1: Comprador */}
        {state.step === 1 && (
          <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-4">
            <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-3">
              Datos del comprador
            </h2>
            <Field
              label="Nombre y apellido"
              name="name"
              required
              value={state.buyer.name}
              onChange={(v) => setBuyer({ name: v })}
              onBlur={() => blurField(buyerSchema, { ...state.buyer }, 'name')}
              error={errors.name}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              required
              value={state.buyer.email}
              onChange={(v) => setBuyer({ email: v })}
              onBlur={() => blurField(buyerSchema, { ...state.buyer }, 'email')}
              error={errors.email}
            />
            <Field
              label="Teléfono"
              name="phone"
              type="tel"
              inputMode="tel"
              required
              value={state.buyer.phone}
              onChange={(v) => setBuyer({ phone: v })}
              onBlur={() => blurField(buyerSchema, { ...state.buyer }, 'phone')}
              error={errors.phone}
            />
            <button
              type="button"
              onClick={nextFromBuyer}
              className="self-start bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-6 text-sm hover:opacity-90 transition-opacity"
            >
              Continuar
            </button>
          </section>
        )}

        {/* Paso 2: Dirección */}
        {state.step === 2 && (
          <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-4">
            <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-3">
              Dirección de envío
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Calle"
                name="street"
                required
                className="col-span-2"
                value={state.address.street}
                onChange={(v) => setAddress({ street: v })}
                onBlur={() => blurField(shippingAddressSchema, { ...state.address }, 'street')}
                error={errors.street}
              />
              <Field
                label="Número"
                name="number"
                required
                value={state.address.number}
                onChange={(v) => setAddress({ number: v })}
                onBlur={() => blurField(shippingAddressSchema, { ...state.address }, 'number')}
                error={errors.number}
              />
              <Field
                label="Piso / Depto (opcional)"
                name="floor"
                value={state.address.floor}
                onChange={(v) => setAddress({ floor: v })}
              />
              <Field
                label="Ciudad"
                name="city"
                required
                value={state.address.city}
                onChange={(v) => setAddress({ city: v })}
                onBlur={() => blurField(shippingAddressSchema, { ...state.address }, 'city')}
                error={errors.city}
              />
              <Field
                label="Provincia"
                name="province"
                required
                value={state.address.province}
                onChange={(v) => setAddress({ province: v })}
                onBlur={() => blurField(shippingAddressSchema, { ...state.address }, 'province')}
                error={errors.province}
              />
              <Field
                label="Código postal"
                name="postalCode"
                required
                inputMode="numeric"
                maxLength={4}
                value={state.address.postalCode}
                onChange={(v) => setAddress({ postalCode: v.replace(/\D/g, '').slice(0, 4) })}
                onBlur={() => blurField(shippingAddressSchema, { ...state.address }, 'postalCode')}
                error={errors.postalCode}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="border-2 border-charcoal text-on-surface font-black uppercase tracking-widest py-3 px-6 text-sm hover:bg-charcoal hover:text-on-primary transition-colors"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={nextFromAddress}
                className="bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-6 text-sm hover:opacity-90 transition-opacity"
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {/* Paso 3: Envío */}
        {state.step === 3 && (
          <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-4">
            <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-3">
              Método de envío
            </h2>
            <ShippingSelector
              postalCode={state.address.postalCode}
              items={cartLines}
              selected={state.shipping}
              onSelect={setShipping}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="border-2 border-charcoal text-on-surface font-black uppercase tracking-widest py-3 px-6 text-sm hover:bg-charcoal hover:text-on-primary transition-colors"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => goToStep(4)}
                disabled={!state.shipping}
                className="bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-6 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar al pago
              </button>
            </div>
          </section>
        )}

        {/* Paso 4: Pago */}
        {state.step === 4 && (
          <PaymentStep
            buyer={state.buyer}
            address={state.address}
            shipping={state.shipping}
            items={cartLines}
            total={total}
            subtotal={totalPrice}
            method={paymentMethod}
            onMethodChange={setPaymentMethod}
            transferEnabled={transferEnabled}
            onBack={() => goToStep(3)}
            onPreferenceCreated={() => setPaying(true)}
          />
        )}
      </div>

      {/* Resumen */}
      <div className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-5 sticky top-24">
        <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-4">
          Resumen
        </h2>
        <div className="flex flex-col gap-2">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between items-start gap-2 text-sm">
              <span className="text-on-surface-variant font-medium leading-tight flex-1 min-w-0">
                <span className="font-black text-on-surface">{quantity}×</span> {product.name}
              </span>
              <span className="font-black text-on-surface flex-shrink-0">
                {formatPrice(product.price * quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t-2 border-charcoal pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant font-medium">Subtotal</span>
            <span className="font-black text-on-surface">{formatPrice(totalPrice)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-700 font-medium">Descuento por transferencia</span>
              <span className="font-black text-emerald-700">-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant font-medium">Envío</span>
            <span className="font-black text-on-surface">
              {!state.shipping ? 'A calcular' : shippingCost > 0 ? formatPrice(shippingCost) : 'Gratis'}
            </span>
          </div>
        </div>
        <div className="border-t-2 border-charcoal pt-4 flex justify-between items-center">
          <span className="font-black uppercase tracking-wide text-on-surface">Total</span>
          <span className="text-2xl font-black text-accent-red">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}
