'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Field from '@/app/components/checkout/Field'
import { submitCancellationRequest } from '@/lib/cancellations/actions'

type Values = {
  orderNumber: string
  email: string
  name: string
  phone: string
  reason: string
}

const EMPTY: Values = { orderNumber: '', email: '', name: '', phone: '', reason: '' }

export default function CancellationForm() {
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof Values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setErrors({})

    startTransition(async () => {
      const res = await submitCancellationRequest({
        orderNumber: values.orderNumber,
        email: values.email,
        name: values.name,
        ...(values.phone.trim() ? { phone: values.phone } : {}),
        ...(values.reason.trim() ? { reason: values.reason } : {}),
      })

      if (res.success) {
        setDone(true)
        return
      }

      // Errores por campo (Zod) vs error general (rate limit, duplicado, etc.).
      if (res.fields && res.fields.length > 0) {
        const byField: Partial<Record<keyof Values, string>> = {}
        for (const f of res.fields) {
          if (f.field in EMPTY) byField[f.field as keyof Values] = f.message
        }
        setErrors(byField)
        // Un error de campo que no matchea ninguno del form igual tiene que verse.
        if (Object.keys(byField).length === 0) setFormError(res.error)
      } else {
        setFormError(res.error)
      }
    })
  }

  if (done) {
    return (
      <div
        role="status"
        className="border-2 border-charcoal bg-surface-container-lowest p-6 flex flex-col gap-3"
      >
        <span className="material-symbols-outlined text-4xl text-accent-red">task_alt</span>
        <h2 className="text-lg font-black uppercase tracking-tight text-on-surface">
          Recibimos tu pedido
        </h2>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          Te mandamos un mail a <strong>{values.email}</strong> como constancia. Nos vamos a
          contactar dentro de las próximas 48 horas hábiles para coordinar el retiro del producto
          y el reintegro del importe.
        </p>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          Si no ves el mail, revisá la carpeta de spam.
        </p>
        <Link
          href="/"
          className="self-start bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-6 text-sm hover:opacity-90 transition-opacity mt-2"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="border-2 border-charcoal bg-surface-container-lowest p-6 flex flex-col gap-4"
    >
      <h2 className="text-lg font-black uppercase tracking-tight text-on-surface border-b-2 border-charcoal pb-3">
        Formulario de arrepentimiento
      </h2>

      <Field
        label="Número de orden"
        name="orderNumber"
        value={values.orderNumber}
        onChange={(v) => set('orderNumber', v)}
        error={errors.orderNumber}
        placeholder="Ej: FE-2026-0123"
        required
      />

      <Field
        label="Email de la compra"
        name="email"
        type="email"
        inputMode="email"
        value={values.email}
        onChange={(v) => set('email', v)}
        error={errors.email}
        placeholder="tu@email.com"
        required
      />

      <Field
        label="Nombre y apellido"
        name="name"
        value={values.name}
        onChange={(v) => set('name', v)}
        error={errors.name}
        required
      />

      <Field
        label="Teléfono (opcional)"
        name="phone"
        type="tel"
        inputMode="tel"
        value={values.phone}
        onChange={(v) => set('phone', v)}
        error={errors.phone}
        placeholder="Para coordinar el retiro más rápido"
      />

      <div className="flex flex-col gap-1">
        <label
          htmlFor="reason"
          className="text-xs font-black uppercase tracking-wide text-on-surface-variant"
        >
          Motivo (opcional)
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          maxLength={1000}
          value={values.reason}
          onChange={(e) => set('reason', e.target.value)}
          aria-describedby="reason-help"
          className="border-2 border-outline bg-surface-container-lowest px-3 py-2.5 text-sm font-medium text-on-surface outline-none transition-colors focus:border-primary-container resize-y"
        />
        <span id="reason-help" className="text-xs text-on-surface-variant">
          No estás obligado a dar un motivo. Nos sirve solo para mejorar.
        </span>
      </div>

      {formError && (
        <p role="alert" className="text-sm font-bold text-accent-red">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-accent-red text-on-primary font-black uppercase tracking-widest py-4 px-8 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? 'Enviando…' : 'Enviar pedido de arrepentimiento'}
      </button>
    </form>
  )
}
