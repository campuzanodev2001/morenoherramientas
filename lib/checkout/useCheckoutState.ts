'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ShippingOptionView } from '@/app/components/checkout/ShippingSelector'

export type BuyerState = { name: string; email: string; phone: string }
export type AddressState = {
  street: string
  number: string
  floor: string
  apartment: string
  city: string
  province: string
  postalCode: string
}

export type CheckoutState = {
  step: number // 1..4
  buyer: BuyerState
  address: AddressState
  shipping: ShippingOptionView | null
}

const STORAGE_KEY = 'checkout'

const emptyState: CheckoutState = {
  step: 1,
  buyer: { name: '', email: '', phone: '' },
  address: {
    street: '',
    number: '',
    floor: '',
    apartment: '',
    city: '',
    province: '',
    postalCode: '',
  },
  shipping: null,
}

function isState(x: unknown): x is CheckoutState {
  if (!x || typeof x !== 'object') return false
  const s = x as Partial<CheckoutState>
  return typeof s.step === 'number' && typeof s.buyer === 'object' && typeof s.address === 'object'
}

/**
 * Estado del checkout persistido en sessionStorage para sobrevivir recargas.
 * `prefillBuyer` precarga los datos del comprador si está logueado (solo en el
 * estado inicial, sin pisar lo que el usuario ya escribió).
 */
export function useCheckoutState(prefillBuyer?: Partial<BuyerState>) {
  const [state, setState] = useState<CheckoutState>(emptyState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      let next = emptyState
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed: unknown = JSON.parse(raw)
          if (isState(parsed)) next = parsed
        }
      } catch {
        // estado corrupto: arrancar limpio
      }
      if (prefillBuyer) {
        next = {
          ...next,
          buyer: {
            name: next.buyer.name || prefillBuyer.name || '',
            email: next.buyer.email || prefillBuyer.email || '',
            phone: next.buyer.phone || prefillBuyer.phone || '',
          },
        }
      }
      if (!cancelled) {
        setState(next)
        setHydrated(true)
      }
    }
    void hydrate()
    return () => {
      cancelled = true
    }
    // Solo en mount: el prefill no debe re-disparar la hidratación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (hydrated) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const setBuyer = useCallback((buyer: Partial<BuyerState>) => {
    setState((s) => ({ ...s, buyer: { ...s.buyer, ...buyer } }))
  }, [])
  const setAddress = useCallback((address: Partial<AddressState>) => {
    setState((s) => ({ ...s, address: { ...s.address, ...address } }))
  }, [])
  const setShipping = useCallback((shipping: ShippingOptionView | null) => {
    setState((s) => ({ ...s, shipping }))
  }, [])
  const setStep = useCallback((step: number) => {
    setState((s) => ({ ...s, step }))
  }, [])
  const clear = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setState(emptyState)
  }, [])

  return { state, hydrated, setBuyer, setAddress, setShipping, setStep, clear }
}
