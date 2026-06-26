'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileName } from '@/lib/account/actions'

export default function ProfileForm({
  initialName,
  email,
  emailEditable,
}: {
  initialName: string
  email: string
  emailEditable: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  function save() {
    setFeedback(null)
    startTransition(async () => {
      const res = await updateProfileName(name)
      if (res.success) {
        setFeedback({ ok: true, msg: 'Datos actualizados' })
        router.refresh()
      } else {
        setFeedback({ ok: false, msg: res.error })
      }
    })
  }

  return (
    <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-4">
      <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-3">
        Datos personales
      </h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
          Nombre
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
          Email
        </label>
        <input
          id="email"
          value={email}
          disabled
          readOnly
          className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface-variant bg-surface-container cursor-not-allowed"
        />
        {!emailEditable && (
          <span className="text-xs text-on-surface-variant">
            El email no se puede editar en cuentas vinculadas con Google.
          </span>
        )}
      </div>

      {feedback && (
        <p className={`text-sm font-bold ${feedback.ok ? 'text-primary-container' : 'text-accent-red'}`}>
          {feedback.msg}
        </p>
      )}

      <button
        onClick={save}
        disabled={pending || name.trim() === initialName.trim() || name.trim() === ''}
        className="self-start bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-6 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? 'Guardando…' : 'Guardar'}
      </button>
    </section>
  )
}
