import Image from 'next/image'
import Link from 'next/link'
import type { ProductCard as Card } from '@/lib/db/queries/catalog'
import { formatPrice } from '@/lib/catalog/format'
import {
  INSTALLMENTS,
  LOW_STOCK_THRESHOLD,
  discountPercent,
  installmentAmount,
  transferPrice,
} from '@/lib/catalog/pricing'

const PLACEHOLDER = '/file.svg'

/**
 * Aviso de disponibilidad. El número exacto solo se muestra cuando queda poco:
 * "quedan 47" no le dice nada al comprador, "últimas 3" sí.
 */
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-outline">
        <span className="size-1.5 rounded-full bg-outline" />
        Sin stock
      </span>
    )
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-600" />
        {stock === 1 ? 'Última unidad' : `Últimas ${stock} unidades`}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      En stock
    </span>
  )
}

export default function ProductCard({ card }: { card: Card }) {
  const off = discountPercent(card.price, card.compareAtPrice)
  const transfer = transferPrice(card.price)
  const installment = installmentAmount(card.price)
  const outOfStock = card.stock === 0

  return (
    <Link
      href={`/producto/${card.slug}`}
      className="flex flex-col bg-surface-container-lowest group border-2 border-charcoal hover:border-accent-red transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[6px_6px_0px_0px_rgba(204,34,0,0.25)]"
    >
      {/* Borde inferior como separador entre la foto y los datos. */}
      <div className="relative aspect-square overflow-hidden bg-white border-b-2 border-charcoal group-hover:border-accent-red transition-colors duration-200">
        <Image
          src={card.imageUrl ?? PLACEHOLDER}
          alt={card.name}
          fill
          sizes="(max-width: 768px) 50vw, 240px"
          className={`object-contain p-2 transition-transform duration-300 group-hover:scale-105 ${
            outOfStock ? 'opacity-40 grayscale' : ''
          }`}
        />
        {off != null && (
          <span className="absolute top-2 left-2 bg-accent-red text-on-primary text-[11px] font-black px-2 py-1 tabular-nums">
            -{off}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-2 right-2 bg-charcoal/90 text-on-primary text-[10px] font-black uppercase tracking-wider px-2 py-1">
            Sin stock
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant truncate">
            {card.brand ?? ''}
          </span>
          {card.sku && (
            <span className="text-[10px] font-medium tabular-nums text-on-surface-variant shrink-0">
              {card.sku}
            </span>
          )}
        </div>

        <span className="text-m font-black uppercase leading-tight text-on-surface line-clamp-2">
          {card.name}
        </span>

        <StockBadge stock={card.stock} />

        {/* Los precios se separan del resto con una línea, no con un cambio de fondo. */}
        <div className="mt-auto pt-2 border-t border-outline/30 flex flex-col gap-0.5">
          {card.compareAtPrice != null && card.compareAtPrice > card.price && (
            <span className="text-on-surface-variant text-xs line-through leading-none">
              {formatPrice(card.compareAtPrice)}
            </span>
          )}
          <span className="text-accent-red text-lg font-black leading-none">
            {formatPrice(card.price)}
          </span>
          <span className="text-[11px] text-on-surface-variant leading-tight">
            {INSTALLMENTS.count} cuotas{INSTALLMENTS.interestFree ? ' sin interés' : ''} de{' '}
            <span className="font-bold tabular-nums">{formatPrice(installment)}</span>
          </span>
          <span className="text-[11px] text-emerald-700 font-bold leading-tight">
            {formatPrice(transfer)} <span className="font-medium">con transferencia</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
