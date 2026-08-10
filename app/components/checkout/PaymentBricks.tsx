'use client'

import { useEffect, useRef, useState } from 'react'
import { clientEnv } from '@/lib/env'
import { getMpErrorMessage } from '@/lib/errors/mp-error-messages'

/**
 * Tipos mínimos del SDK de MercadoPago (no hay @types oficiales).
 * Sólo se declara lo que este componente usa del Payment Brick.
 */
type BrickFormData = {
  token?: string
  payment_method_id: string
  issuer_id?: string
  installments?: number
  payer?: {
    email?: string
    identification?: { type?: string; number?: string }
  }
}

type MpBricksController = {
  create: (
    brick: 'payment',
    container: string,
    settings: {
      initialization: {
        amount: number
        payer?: { email?: string }
      }
      customization: {
        visual?: { style?: { theme?: string } }
        paymentMethods: Record<string, unknown>
      }
      callbacks: {
        onReady?: () => void
        onError?: (error: { message?: string; cause?: string }) => void
        onSubmit: (arg: { formData: BrickFormData }) => Promise<void>
      }
    },
  ) => Promise<{ unmount?: () => void }>
}
type MpInstance = { bricks: () => MpBricksController }
type MpConstructor = new (publicKey: string, options?: { locale?: string }) => MpInstance

declare global {
  interface Window {
    MercadoPago?: MpConstructor
  }
}

const SDK_SRC = 'https://sdk.mercadopago.com/js/v2'

function loadSdk(): Promise<MpConstructor> {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve(window.MercadoPago)
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.MercadoPago) resolve(window.MercadoPago)
        else reject(new Error('SDK no disponible'))
      })
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK')))
      return
    }
    const script = document.createElement('script')
    script.src = SDK_SRC
    script.onload = () => {
      if (window.MercadoPago) resolve(window.MercadoPago)
      else reject(new Error('SDK no disponible'))
    }
    script.onerror = () => reject(new Error('No se pudo cargar el SDK'))
    document.body.appendChild(script)
  })
}

const CONTAINER_ID = 'payment-brick-container'

export type PaymentBricksProps = {
  /** Id de la orden ya creada, contra la que se imputa el pago. */
  orderId: string
  /** Total en centavos. El Brick lo necesita en pesos. */
  totalCents: number
  payerEmail: string
  /** Se dispara cuando MP resolvió el pago, con el estado que devolvió. */
  onResolved: (status: string) => void
}

export default function PaymentBricks({
  orderId,
  totalCents,
  payerEmail,
  onResolved,
}: PaymentBricksProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // onResolved en un ref: el Brick se monta una sola vez y no debe re-crearse
  // si el padre re-renderiza con otro closure.
  const onResolvedRef = useRef(onResolved)
  useEffect(() => {
    onResolvedRef.current = onResolved
  })

  useEffect(() => {
    // Sin guard de "ya montado": con StrictMode el efecto corre, se limpia y
    // vuelve a correr. Un guard hacía que la segunda pasada saliera temprano
    // mientras la primera ya se había cancelado, así que create() no se
    // llamaba nunca y el contenedor quedaba vacío para siempre.
    // El ciclo correcto es el que pide MP: desmontar al salir, crear una
    // instancia nueva al entrar.
    let disposed = false
    let controller: { unmount?: () => void } | null = null

    async function render() {
      try {
        const Mp = await loadSdk()
        if (disposed) return
        const mp = new Mp(clientEnv.NEXT_PUBLIC_MP_PUBLIC_KEY, { locale: 'es-AR' })
        const created = await mp.bricks().create('payment', CONTAINER_ID, {
          initialization: {
            amount: totalCents / 100,
            payer: { email: payerEmail },
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              ticket: 'all',
            },
          },
          callbacks: {
            onReady: () => {
              if (!disposed) setLoading(false)
            },
            onError: (e) => {
              if (!disposed) setError(getMpErrorMessage(e.cause))
            },
            // El Brick espera una promesa: mientras no resuelva, mantiene el
            // botón en estado de carga. Si rechaza, muestra el error y deja
            // reintentar sin perder los datos cargados.
            onSubmit: async ({ formData }) => {
              const res = await fetch('/api/checkout/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId,
                  token: formData.token,
                  paymentMethodId: formData.payment_method_id,
                  issuerId: formData.issuer_id,
                  installments: formData.installments ?? 1,
                  payer: {
                    email: formData.payer?.email ?? payerEmail,
                    ...(formData.payer?.identification?.type &&
                    formData.payer.identification.number
                      ? {
                          identification: {
                            type: formData.payer.identification.type,
                            number: formData.payer.identification.number,
                          },
                        }
                      : {}),
                  },
                }),
              })

              const data = (await res.json()) as
                | { orderId: string; status: string; statusDetail: string }
                | { error: { message: string } }

              if (!res.ok || !('status' in data)) {
                const message =
                  'error' in data ? data.error.message : 'No pudimos procesar el pago.'
                setError(message)
                throw new Error(message)
              }

              if (data.status === 'rejected') {
                const message = getMpErrorMessage(data.statusDetail)
                setError(message)
                throw new Error(message)
              }

              setError(null)
              onResolvedRef.current(data.status)
            },
          },
        })
        // Si el componente se fue mientras create() resolvía, desmontar el
        // Brick recién creado en vez de dejarlo huérfano en el DOM.
        if (disposed) {
          created?.unmount?.()
          return
        }
        controller = created
      } catch {
        if (!disposed) {
          setError('No pudimos cargar los medios de pago. Recargá la página.')
          setLoading(false)
        }
      }
    }
    void render()
    return () => {
      disposed = true
      controller?.unmount?.()
    }
  }, [orderId, totalCents, payerEmail])

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-sm font-bold text-accent-red border-2 border-accent-red/40 bg-accent-red/5 p-3">
          {error}
        </p>
      )}
      {loading && !error && (
        <div
          className="h-64 w-full animate-pulse bg-surface-container border-2 border-outline"
          aria-busy="true"
        />
      )}
      <div id={CONTAINER_ID} />
    </div>
  )
}
