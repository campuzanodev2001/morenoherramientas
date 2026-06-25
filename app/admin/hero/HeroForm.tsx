'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadToCloudinary } from '@/lib/cloudinary/upload-client'
import { updateHeroAction } from '@/lib/admin/home-actions'

type Hero = { imageUrl: string; title: string; ctaText: string }

export default function HeroForm({ initial }: { initial: Hero }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(initial)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploadPct(0)
    try {
      const url = await uploadToCloudinary(file, 'hero', setUploadPct)
      setForm((f) => ({ ...f, imageUrl: url }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir')
    } finally {
      setUploadPct(null)
    }
  }

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
    <form onSubmit={submit} className="p-4 md:p-6 flex flex-col gap-4 max-w-2xl">
      <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Hero</h1>

      {form.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={form.imageUrl} alt="" className="w-full h-48 object-cover border border-surface-container" />
      )}
      {uploadPct !== null && (
        <div className="h-2 bg-surface-container">
          <div className="h-2 bg-primary-container" style={{ width: `${uploadPct}%` }} />
        </div>
      )}

      <label className="text-xs font-black uppercase text-primary-container hover:underline cursor-pointer self-start">
        Subir imagen
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>

      <Field label="URL de imagen">
        <input className={inputClass} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
      </Field>
      <Field label="Título">
        <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="Texto del botón">
        <input className={inputClass} value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
      </Field>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      {saved && <p className="text-sm text-green-700 font-medium">Guardado ✓</p>}

      <button type="submit" disabled={pending || uploadPct !== null} className="bg-primary-container text-on-primary font-black uppercase py-3 px-6 self-start disabled:opacity-50">
        {pending ? 'Guardando…' : 'Guardar'}
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
