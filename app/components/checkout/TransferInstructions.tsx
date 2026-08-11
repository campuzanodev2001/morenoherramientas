'use client'

import { useState } from 'react'
import type { TransferAccount } from '@/lib/payments/transfer'
import { formatPrice } from '@/lib/catalog/format'

/**
 * Un dato bancario con botón de copiar. El CBU tipeado a mano es la principal
 * fuente de transferencias fallidas: acá siempre se copia.
 */
function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso de clipboard el valor sigue visible y seleccionable.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-outline/40 py-2">
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-black uppercase tracking-wide text-on-surface-variant">
          {label}
        </span>
        <span className="font-black text-on-surface break-all">{value}</span>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar ${label}`}
        className="shrink-0 flex items-center gap-1 border-2 border-charcoal text-on-surface font-black uppercase tracking-wide py-1.5 px-3 text-[11px] hover:bg-charcoal hover:text-on-primary transition-colors"
      >
        <span className="material-symbols-outlined text-base leading-none">
          {copied ? 'check' : 'content_copy'}
        </span>
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

export type TransferInstructionsProps = {
  account: TransferAccount
  orderNumber: string
  total: number
  /** Mail donde el comprador manda el comprobante. */
  contactEmail: string
}

export default function TransferInstructions({
  account,
  orderNumber,
  total,
  contactEmail,
}: TransferInstructionsProps) {
  return (
    <section className="bg-surface-container-lowest border-2 border-charcoal p-6 flex flex-col gap-4">
      <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b-2 border-charcoal pb-3">
        Datos para transferir
      </h2>

      <div className="flex items-baseline justify-between gap-3 bg-surface-container p-3">
        <span className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
          Importe a transferir
        </span>
        <span className="text-2xl font-black text-accent-red">{formatPrice(total)}</span>
      </div>

      <div className="flex flex-col">
        <CopyRow label="CBU" value={account.cbu} />
        <CopyRow label="Alias" value={account.alias} />
        <div className="flex flex-col py-2 border-b border-outline/40">
          <span className="text-[11px] font-black uppercase tracking-wide text-on-surface-variant">
            Titular
          </span>
          <span className="font-black text-on-surface">{account.accountHolder}</span>
        </div>
        <div className="flex flex-col py-2 border-b border-outline/40">
          <span className="text-[11px] font-black uppercase tracking-wide text-on-surface-variant">
            Banco
          </span>
          <span className="font-black text-on-surface">{account.bankName}</span>
        </div>
        {account.cuit && (
          <div className="flex flex-col py-2 border-b border-outline/40">
            <span className="text-[11px] font-black uppercase tracking-wide text-on-surface-variant">
              CUIT
            </span>
            <span className="font-black text-on-surface">{account.cuit}</span>
          </div>
        )}
      </div>

      <ol className="flex flex-col gap-2 text-sm text-on-surface-variant font-medium list-decimal pl-5">
        <li>
          Transferí <span className="font-black text-on-surface">{formatPrice(total)}</span> exactos
          a la cuenta de arriba.
        </li>
        <li>
          Poné como referencia el número de orden:{' '}
          <span className="font-black text-on-surface">{orderNumber}</span>.
        </li>
        <li>
          Mandanos el comprobante a{' '}
          <a href={`mailto:${contactEmail}`} className="font-black text-accent-red underline">
            {contactEmail}
          </a>
          .
        </li>
      </ol>

      <p className="text-xs font-medium text-on-surface-variant border-l-4 border-accent-red pl-3">
        El pedido se prepara cuando verificamos la transferencia (suele ser el mismo día hábil). El
        stock no queda reservado hasta ese momento.
      </p>
    </section>
  )
}
