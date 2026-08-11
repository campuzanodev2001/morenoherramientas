'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { resolveCancellationRequest } from '@/lib/cancellations/actions'
import type { CancellationStatus } from '@/lib/db/types'

type Props = {
  id: string
  orderId: string | null
  orderNumber: string
  name: string
  email: string
  phone: string | null
  reason: string | null
  status: CancellationStatus
  adminNote: string | null
  createdAt: string
  orderStatus: string | null
}

const STATUS_LABEL: Record<CancellationStatus, string> = {
  pending: 'Pendiente',
  in_review: 'En gestión',
  resolved: 'Resuelto',
}

const STATUS_CLASS: Record<CancellationStatus, string> = {
  pending: 'bg-accent-red text-on-primary',
  in_review: 'bg-primary-container text-on-primary',
  resolved: 'bg-surface-container text-on-surface-variant',
}

export default function CancellationRow(props: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<CancellationStatus>(props.status)
  const [note, setNote] = useState(props.adminNote ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save() {
    setError(null)
    startTransition(async () => {
      const res = await resolveCancellationRequest({
        id: props.id,
        status,
        ...(note.trim() ? { adminNote: note } : {}),
      })
      if (res.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="border-2 border-charcoal bg-surface-container-lowest">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span
          className={`text-xs font-black uppercase tracking-wide px-2 py-1 ${STATUS_CLASS[props.status]}`}
        >
          {STATUS_LABEL[props.status]}
        </span>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-on-surface">{props.orderNumber}</span>
            {props.orderId ? (
              <Link
                href={`/admin/ordenes/${props.orderId}`}
                className="text-xs font-bold text-accent-red underline"
              >
                Ver orden{props.orderStatus ? ` (${props.orderStatus})` : ''}
              </Link>
            ) : (
              <span
                className="text-xs font-bold text-accent-red"
                title="El número no coincide con ninguna orden de ese email"
              >
                ⚠ Sin orden vinculada
              </span>
            )}
          </div>
          <span className="text-xs text-on-surface-variant truncate">
            {props.name} · {props.email}
            {props.phone ? ` · ${props.phone}` : ''}
          </span>
        </div>

        <span className="text-xs text-on-surface-variant">{props.createdAt}</span>

        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs font-black uppercase tracking-wide border-2 border-charcoal px-3 py-2 hover:bg-surface-container transition-colors"
        >
          {open ? 'Cerrar' : 'Gestionar'}
        </button>
      </div>

      {open && (
        <div className="border-t-2 border-charcoal p-4 flex flex-col gap-4 bg-surface">
          {props.reason && (
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant mb-1">
                Motivo que dejó el comprador
              </p>
              <p className="text-sm text-on-surface whitespace-pre-wrap">{props.reason}</p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`status-${props.id}`}
              className="text-xs font-black uppercase tracking-wide text-on-surface-variant"
            >
              Estado
            </label>
            <select
              id={`status-${props.id}`}
              value={status}
              onChange={(e) => setStatus(e.target.value as CancellationStatus)}
              className="border-2 border-outline bg-surface-container-lowest px-3 py-2.5 text-sm font-medium text-on-surface outline-none focus:border-primary-container"
            >
              <option value="pending">Pendiente</option>
              <option value="in_review">En gestión</option>
              <option value="resolved">Resuelto</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`note-${props.id}`}
              className="text-xs font-black uppercase tracking-wide text-on-surface-variant"
            >
              Nota interna
            </label>
            <textarea
              id={`note-${props.id}`}
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qué se hizo: retiro coordinado, reintegro enviado, motivo del rechazo…"
              className="border-2 border-outline bg-surface-container-lowest px-3 py-2.5 text-sm font-medium text-on-surface outline-none focus:border-primary-container resize-y"
            />
            <span className="text-xs text-on-surface-variant">
              Solo la ve el equipo. Nunca se le muestra al comprador.
            </span>
          </div>

          {error && <p className="text-sm font-bold text-accent-red">{error}</p>}

          <button
            onClick={save}
            disabled={pending}
            className="self-start bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-6 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  )
}
