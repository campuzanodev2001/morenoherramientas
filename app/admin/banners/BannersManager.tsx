'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadToCloudinary } from '@/lib/cloudinary/upload-client'
import { createBannerAction, updateBannerAction, deleteBannerAction } from '@/lib/admin/banner-actions'

export type BannerRow = {
  id: string
  title: string
  imageUrl: string
  linkUrl: string
  order: number
  active: boolean
  startsAt: string
  endsAt: string
}

const blank = { title: '', imageUrl: '', linkUrl: '', order: 0, active: true, startsAt: '', endsAt: '' }

export default function BannersManager({ banners }: { banners: BannerRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(blank)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [error, setError] = useState('')

  function reset() {
    setEditingId(null)
    setForm(blank)
    setError('')
  }
  function startEdit(b: BannerRow) {
    setEditingId(b.id)
    setForm({ ...b })
    setError('')
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploadPct(0)
    try {
      const url = await uploadToCloudinary(file, 'banners', setUploadPct)
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
    const input = {
      title: form.title,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl,
      order: Number(form.order),
      active: form.active,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    }
    startTransition(async () => {
      const result = editingId ? await updateBannerAction(editingId, input) : await createBannerAction(input)
      if (!result.success) {
        setError(result.fields?.[0]?.message ?? result.error)
        return
      }
      reset()
      router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteBannerAction(id)
      router.refresh()
    })
  }

  const inputClass =
    'border-2 border-outline px-3 py-2 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container'

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-3xl">
      <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Banners</h1>

      <form onSubmit={submit} className="bg-surface-container-lowest border border-surface-container p-4 flex flex-col gap-3">
        <span className="text-xs font-black uppercase text-on-surface tracking-wider">
          {editingId ? 'Editar banner' : 'Nuevo banner'}
        </span>

        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imageUrl} alt="" className="w-full h-32 object-cover border border-surface-container" />
        )}
        {uploadPct !== null && (
          <div className="h-2 bg-surface-container">
            <div className="h-2 bg-primary-container" style={{ width: `${uploadPct}%` }} />
          </div>
        )}
        <label className="text-xs font-black uppercase text-primary-container hover:underline cursor-pointer self-start">
          {form.imageUrl ? 'Cambiar imagen' : '+ Subir imagen'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-bold text-on-surface-variant">
            Título
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-on-surface-variant">
            Link destino (opcional)
            <input className={inputClass} placeholder="/categoria/llaves" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-on-surface-variant">
            Orden
            <input className={inputClass} type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
            <span className="font-medium normal-case text-on-surface-variant/70">
              Posición entre los banners: el más bajo se muestra primero.
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-on-surface sm:self-end sm:pb-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Activo
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-on-surface-variant">
            Desde
            <input className={inputClass} type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-on-surface-variant">
            Hasta
            <input className={inputClass} type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </label>
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={pending || uploadPct !== null} className="bg-primary-container text-on-primary font-black uppercase py-2 px-5 text-xs disabled:opacity-50">
            {editingId ? 'Guardar' : 'Crear'}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="border-2 border-outline text-on-surface font-black uppercase py-2 px-5 text-xs">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-2">
        {banners.map((b) => (
          <div key={b.id} className="bg-surface-container-lowest border border-surface-container p-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.imageUrl} alt="" className="w-24 h-14 object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-on-surface text-xs uppercase truncate">{b.title}</span>
                {!b.active && <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 uppercase">Inactivo</span>}
              </div>
              <span className="text-xs text-on-surface-variant">orden {b.order}{b.linkUrl ? ` · → ${b.linkUrl}` : ''}</span>
            </div>
            <button onClick={() => startEdit(b)} className="text-on-surface-variant hover:text-primary-container p-1.5" title="Editar">
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
            <button onClick={() => remove(b.id)} disabled={pending} className="text-on-surface-variant hover:text-accent-red p-1.5 disabled:opacity-40" title="Borrar">
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="py-12 text-center text-on-surface-variant text-sm font-medium">No hay banners todavía</div>
        )}
      </div>
    </div>
  )
}
