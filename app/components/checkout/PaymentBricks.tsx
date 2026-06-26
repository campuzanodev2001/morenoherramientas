'use client'

import { useEffect, useRef, useState } from 'react'
import { clientEnv } from '@/lib/env'
import { getMpErrorMessage } from '@/lib/errors/mp-error-messages'

/** Tipos mínimos del SDK de MercadoPago (no hay @types oficiales). */
type MpBricksController = {
  create: (
    brick: string,
    container: string,
    settings: {
      initialization: { preferenceId: string }
      callbacks: { onError?: (error: { message?: string; cause?: string }) => void; onReady?: () => void }
    },
  ) => Promise<unknown>
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

const CONTAINER_ID = 'wallet-brick-container'

export default function PaymentBricks({ preferenceId }: { preferenceId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    let cancelled = false

    async function render() {
      try {
        const Mp = await loadSdk()
        if (cancelled) return
        const mp = new Mp(clientEnv.NEXT_PUBLIC_MP_PUBLIC_KEY, { locale: 'es-AR' })
        await mp.bricks().create('wallet', CONTAINER_ID, {
          initialization: { preferenceId },
          callbacks: {
            onReady: () => {
              if (!cancelled) setLoading(false)
            },
            onError: (e) => {
              if (!cancelled) setError(getMpErrorMessage(e.cause))
            },
          },
        })
      } catch {
        if (!cancelled) {
          setError('No pudimos cargar los medios de pago. Recargá la página.')
          setLoading(false)
        }
      }
    }
    void render()
    return () => {
      cancelled = true
    }
  }, [preferenceId])

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-sm font-bold text-accent-red border-2 border-accent-red/40 bg-accent-red/5 p-3">
          {error}
        </p>
      )}
      {loading && !error && (
        <div className="h-14 w-full animate-pulse bg-surface-container border-2 border-outline" aria-busy="true" />
      )}
      <div id={CONTAINER_ID} />
    </div>
  )
}
