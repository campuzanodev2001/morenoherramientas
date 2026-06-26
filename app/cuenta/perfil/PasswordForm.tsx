'use client'

import { useState, useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { changePassword } from '@/lib/account/actions'

type Fields = { field: string; message: string }[]

export default function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  function mapFields(fields?: Fields): Record<string, string> {
    const map: Record<string, string> = {}
    for (const f of fields ?? []) map[f.field] = f.message
    return map
  }

  function submit() {
    setError(null)
    setFieldErrors({})
    startTransition(async () => {
      const res = await changePassword({
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      })
      if (res.success) {
        setDone(true)
        // La sesión fue invalidada: redirigir al login.
        setTimeout(() => void signOut({ callbackUrl: '/login' }), 1500)
      } else {
        setError(res.error)
        setFieldErrors(mapFields(res.fields))
      }
    })
  }

  if (done) {
    return (
      <section className="bg-surface-container-lowest border-2 border-charcoal p-6">
        <p className="text-sm font-bold text-primary-container">
          Contraseña actualizada. Por seguridad vas a tener que iniciar sesión de nuevo…
        </p>
      </section>
    )
  }

  const inputCls = (field: string) =>
    `border-2 px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container ${
      fieldErrors[field] ? 'border-accent-red' : 'border-outline'
    }`

  return (
    <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-4">
      <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-3">
        Cambiar contraseña
      </h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="current" className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
          Contraseña actual
        </label>
        <input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls('currentPassword')} />
        {fieldErrors.currentPassword && <span className="text-xs font-bold text-accent-red">{fieldErrors.currentPassword}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="new" className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
          Nueva contraseña
        </label>
        <input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls('newPassword')} />
        {fieldErrors.newPassword && <span className="text-xs font-bold text-accent-red">{fieldErrors.newPassword}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirm" className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
          Confirmar nueva contraseña
        </label>
        <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls('confirmPassword')} />
        {fieldErrors.confirmPassword && <span className="text-xs font-bold text-accent-red">{fieldErrors.confirmPassword}</span>}
      </div>

      {error && <p className="text-sm font-bold text-accent-red">{error}</p>}

      <button
        onClick={submit}
        disabled={pending || !current || !next || !confirm}
        className="self-start bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-6 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </section>
  )
}
