'use client'

import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '@/lib/catalog/format'
import type { CartLineInput } from '@/lib/validations/checkout'

export type ShippingOptionView = {
  id: string
  carrier: 'andreani' | 'correo-argentino'
  service: string
  price: number
  estimatedDays: number
}

type Props = {
  postalCode: string
  items: CartLineInput[]
  selectedId: string | null
  onSelect: (option: ShippingOptionView | null) => void
}

const CARRIER_LABEL: Record<ShippingOptionView['carrier'], string> = {
  andreani: 'Andreani',
  'correo-argentino': 'Correo Argentino',
}

const isValidCp = (cp: string) => /^\d{4}$/.test(cp)

export default function ShippingSelector({ postalCode, items, selectedId, onSelect }: Props) {
  const [options, setOptions] = useState<ShippingOptionView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  // onSelect en un ref para no convertirlo en dependencia del efecto de fetch.
  const onSelectRef = useRef(onSelect)
  useEffect(() => {
    onSelectRef.current = onSelect
  })

  const itemsKey = JSON.stringify(items)

  useEffect(() => {
    let cancelled = false
    const select = onSelectRef.current

    async function run() {
      if (!isValidCp(postalCode) || items.length === 0) {
        if (!cancelled) {
          setOptions([])
          setLoading(false)
          select(null)
        }
        return
      }

      if (!cancelled) {
        setLoading(true)
        setError(null)
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)
      try {
        const res = await fetch('/api/envios/cotizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postalCode, items }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('quote_failed')
        const data = (await res.json()) as { options: ShippingOptionView[] }
        if (cancelled) return
        setOptions(data.options)
        select(data.options[0] ?? null)
      } catch {
        if (cancelled) return
        setError('No pudimos cotizar el envío. Probá de nuevo.')
        setOptions([])
        select(null)
      } finally {
        clearTimeout(timeout)
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
    // itemsKey representa el contenido de items de forma estable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode, itemsKey, retry])

  if (!isValidCp(postalCode)) {
    return (
      <p className="text-sm text-on-surface-variant font-medium">
        Ingresá un código postal válido (4 dígitos) para ver las opciones de envío.
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 bg-surface-container animate-pulse border-2 border-outline" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 border-2 border-accent-red/40 bg-accent-red/5 p-4">
        <p className="text-sm font-bold text-accent-red">{error}</p>
        <button
          type="button"
          onClick={() => setRetry((n) => n + 1)}
          className="border-2 border-accent-red text-accent-red font-black uppercase tracking-widest py-2 px-4 text-xs hover:bg-accent-red hover:text-on-primary transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant font-medium">
        No hay opciones de envío disponibles para este código postal.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <label
          key={option.id}
          className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-colors ${
            selectedId === option.id
              ? 'border-primary-container bg-primary-container/5'
              : 'border-outline hover:border-primary-container/50'
          }`}
        >
          <input
            type="radio"
            name="shipping-option"
            value={option.id}
            checked={selectedId === option.id}
            onChange={() => onSelect(option)}
            className="accent-accent-red w-4 h-4 flex-shrink-0"
          />
          <div className="flex flex-col gap-0.5 flex-1">
            <span className="text-sm font-black uppercase tracking-wide text-on-surface">
              {CARRIER_LABEL[option.carrier]} · {option.service}
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              Llega en {option.estimatedDays} días hábiles aprox.
            </span>
          </div>
          <span className="text-sm font-black uppercase text-on-surface">
            {formatPrice(option.price)}
          </span>
        </label>
      ))}
    </div>
  )
}
