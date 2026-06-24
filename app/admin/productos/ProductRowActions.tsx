'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setProductActiveAction, deleteProductAction } from '@/lib/admin/product-actions'

export default function ProductRowActions({
  id,
  active,
}: {
  id: string
  active: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function toggle() {
    startTransition(async () => {
      await setProductActiveAction(id, !active)
      router.refresh()
    })
  }

  function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(async () => {
      await deleteProductAction(id)
      setConfirmDelete(false)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={toggle}
        disabled={pending}
        className={`p-1.5 transition-colors duration-150 disabled:opacity-40 ${
          active ? 'text-green-700 hover:text-green-900' : 'text-on-surface-variant hover:text-on-surface'
        }`}
        title={active ? 'Desactivar' : 'Activar'}
      >
        <span className="material-symbols-outlined text-lg">
          {active ? 'toggle_on' : 'toggle_off'}
        </span>
      </button>
      <Link
        href={`/admin/productos/${id}`}
        className="text-on-surface-variant hover:text-primary-container p-1.5 transition-colors duration-150"
        title="Editar"
      >
        <span className="material-symbols-outlined text-lg">edit</span>
      </Link>
      <button
        onClick={remove}
        disabled={pending}
        className={`p-1.5 transition-colors duration-150 disabled:opacity-40 ${
          confirmDelete ? 'text-on-primary bg-accent-red' : 'text-on-surface-variant hover:text-accent-red'
        }`}
        title={confirmDelete ? 'Confirmar eliminación' : 'Eliminar'}
      >
        <span className="material-symbols-outlined text-lg">{confirmDelete ? 'warning' : 'delete'}</span>
      </button>
      {confirmDelete && (
        <button
          onClick={() => setConfirmDelete(false)}
          className="text-on-surface-variant hover:text-on-surface p-1.5"
          title="Cancelar"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  )
}
