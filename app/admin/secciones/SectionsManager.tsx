'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HomeSection } from '@/lib/db/queries/store-settings'
import type { ProductOption } from '@/lib/db/queries/admin-products'
import { deleteSectionAction, moveSectionAction } from '@/lib/admin/home-actions'
import SectionEditor from './SectionEditor'

export default function SectionsManager({
  sections,
  knownProducts,
}: {
  sections: HomeSection[]
  knownProducts: ProductOption[]
}) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const byId = new Map(knownProducts.map((p) => [p.id, p]))

  async function remove(section: HomeSection) {
    if (!confirm(`¿Eliminar la sección “${section.title}”? Los productos no se borran.`)) return
    setError('')
    setBusyId(section.id)
    const result = await deleteSectionAction({ id: section.id })
    setBusyId(null)
    if (!result.success) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function move(section: HomeSection, direction: 'up' | 'down') {
    setError('')
    setBusyId(section.id)
    const result = await moveSectionAction({ id: section.id, direction })
    setBusyId(null)
    if (!result.success) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  function done() {
    setEditingId(null)
    setCreating(false)
    router.refresh()
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Secciones</h1>
        <p className="text-sm text-on-surface-variant font-medium">
          Cada sección es una fila de productos elegidos a mano en la home. Se muestran en el orden de esta lista.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      <div className="flex flex-col gap-3">
        {sections.map((section, index) =>
          editingId === section.id ? (
            <SectionEditor
              key={section.id}
              section={section}
              knownProducts={knownProducts}
              onDone={done}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <article
              key={section.id}
              className="border-2 border-outline bg-surface p-3 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-col min-w-0 flex-grow">
                  <span className="text-sm font-black uppercase text-on-surface truncate">{section.title}</span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    {section.productIds.length} producto{section.productIds.length === 1 ? '' : 's'}
                    {section.active ? '' : ' · oculta'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => move(section, 'up')}
                  disabled={index === 0 || busyId === section.id}
                  className="text-on-surface disabled:opacity-30"
                  aria-label="Subir sección"
                >
                  <span className="material-symbols-outlined text-lg">arrow_upward</span>
                </button>
                <button
                  type="button"
                  onClick={() => move(section, 'down')}
                  disabled={index === sections.length - 1 || busyId === section.id}
                  className="text-on-surface disabled:opacity-30"
                  aria-label="Bajar sección"
                >
                  <span className="material-symbols-outlined text-lg">arrow_downward</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(section.id)}
                  className="text-xs font-black uppercase tracking-wider text-primary-container"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => remove(section)}
                  disabled={busyId === section.id}
                  className="text-xs font-black uppercase tracking-wider text-red-600 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
              {section.productIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {section.productIds.slice(0, 6).map((id) => (
                    <span key={id} className="bg-surface-container text-on-surface text-xs font-bold px-2 py-1 truncate max-w-[220px]">
                      {byId.get(id)?.name ?? 'Producto no disponible'}
                    </span>
                  ))}
                  {section.productIds.length > 6 && (
                    <span className="text-xs font-bold text-on-surface-variant px-2 py-1">
                      +{section.productIds.length - 6}
                    </span>
                  )}
                </div>
              )}
            </article>
          ),
        )}

        {sections.length === 0 && !creating && (
          <p className="text-sm text-on-surface-variant font-medium">
            Todavía no hay secciones. La home muestra los últimos productos cargados hasta que crees una.
          </p>
        )}
      </div>

      {creating ? (
        <SectionEditor knownProducts={knownProducts} onDone={done} onCancel={() => setCreating(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="bg-primary-container text-on-primary font-black uppercase py-3 px-6 self-start"
        >
          Nueva sección
        </button>
      )}
    </div>
  )
}
