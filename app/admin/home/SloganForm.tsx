'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateHeroAction } from '@/lib/admin/home-actions'

export type Slogan = { title: string; ctaText: string }

/** Texto de la franja superior de la home: el eslogan y el botón del buscador. */
export default function SloganForm({ initial }: { initial: Slogan }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    startTransition(async () => {
      const result = await updateHeroAction(form)
      if (!result.success) {
        setError(result.fields?.[0]?.message ?? result.error)
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  const inputClass =
    'border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container w-full'

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 max-w-2xl">
      <Field label="Eslogan">
        <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="Texto del botón">
        <input className={inputClass} value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
      </Field>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      {saved && <p className="text-sm text-green-700 font-medium">Guardado ✓</p>}

      <button type="submit" disabled={pending} className="bg-primary-container text-on-primary font-black uppercase py-2.5 px-5 text-xs self-start disabled:opacity-50">
        {pending ? 'Guardando…' : 'Guardar textos'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-black uppercase text-on-surface tracking-wider">{label}</span>
      {children}
    </div>
  )
}
