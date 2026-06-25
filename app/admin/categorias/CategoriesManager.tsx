'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { CategoryWithCount } from '@/lib/db/queries/admin-categories'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/lib/admin/category-actions'

const blankForm = { name: '', slug: '', parentId: '', order: 0, active: true }

export default function CategoriesManager({ categories }: { categories: CategoryWithCount[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(blankForm)
  const [error, setError] = useState('')

  const roots = categories.filter((c) => c.depth === 0)

  function reset() {
    setEditingId(null)
    setForm(blankForm)
    setError('')
  }

  function startEdit(c: CategoryWithCount) {
    setEditingId(c.id)
    setForm({ name: c.name, slug: c.slug, parentId: c.parentId ?? '', order: c.order, active: c.active })
    setError('')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const input = {
      name: form.name,
      slug: form.slug,
      parentId: form.parentId || null,
      order: Number(form.order),
      active: form.active,
    }
    startTransition(async () => {
      const result = editingId
        ? await updateCategoryAction(editingId, input)
        : await createCategoryAction(input)
      if (!result.success) {
        setError(result.fields?.[0]?.message ?? result.error)
        return
      }
      reset()
      router.refresh()
    })
  }

  function remove(id: string) {
    setError('')
    startTransition(async () => {
      const result = await deleteCategoryAction(id)
      if (!result.success) {
        setError(result.fields?.[0]?.message ?? result.error)
        return
      }
      router.refresh()
    })
  }

  const inputClass =
    'border-2 border-outline px-3 py-2 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container'

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-3xl">
      <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Categorías</h1>

      <form onSubmit={submit} className="bg-surface-container-lowest border border-surface-container p-4 flex flex-col gap-3">
        <span className="text-xs font-black uppercase text-on-surface tracking-wider">
          {editingId ? 'Editar categoría' : 'Nueva categoría'}
        </span>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Slug (opcional)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <select
            className={inputClass}
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          >
            <option value="">Categoría raíz</option>
            {roots
              .filter((r) => r.id !== editingId)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
          </select>
          <input
            className={inputClass}
            type="number"
            placeholder="Orden"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          />
          <label className="flex items-center gap-2 text-sm font-bold text-on-surface">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Activa
          </label>
        </div>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="bg-primary-container text-on-primary font-black uppercase py-2 px-5 text-xs disabled:opacity-50"
          >
            {editingId ? 'Guardar' : 'Crear'}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="border-2 border-outline text-on-surface font-black uppercase py-2 px-5 text-xs">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-surface-container-lowest border border-surface-container divide-y divide-surface-container">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3" style={{ paddingLeft: `${16 + c.depth * 20}px` }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-on-surface text-xs uppercase truncate">{c.name}</span>
                {!c.active && <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 uppercase">Inactiva</span>}
              </div>
              <span className="text-xs text-on-surface-variant">/{c.slug} · {c.productCount} producto(s)</span>
            </div>
            <button onClick={() => startEdit(c)} className="text-on-surface-variant hover:text-primary-container p-1.5" title="Editar">
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
            <button onClick={() => remove(c.id)} disabled={pending} className="text-on-surface-variant hover:text-accent-red p-1.5 disabled:opacity-40" title="Borrar">
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="py-12 text-center text-on-surface-variant text-sm font-medium">No hay categorías todavía</div>
        )}
      </div>
    </div>
  )
}
