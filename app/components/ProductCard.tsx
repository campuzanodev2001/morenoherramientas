import Image from 'next/image'
import Link from 'next/link'
import type { ProductCard as Card } from '@/lib/db/queries/catalog'
import { formatPrice } from '@/lib/catalog/format'

const PLACEHOLDER = '/file.svg'

export default function ProductCard({ card }: { card: Card }) {
  return (
    <Link
      href={`/producto/${card.slug}`}
      className="flex flex-col bg-charcoal group border-b-4 border-transparent hover:border-accent-red transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <Image
          src={card.imageUrl ?? PLACEHOLDER}
          alt={card.name}
          fill
          sizes="(max-width: 768px) 50vw, 240px"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />
        {card.stock === 0 && (
          <span className="absolute top-2 left-2 bg-accent-red text-on-primary text-[10px] font-black uppercase px-2 py-1">
            Sin stock
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-on-primary/60">
          {card.brand ?? ''}
        </span>
        <span className="text-xs font-black uppercase leading-tight text-on-primary line-clamp-2">
          {card.name}
        </span>
        <div className="mt-auto pt-2 flex items-baseline gap-2">
          <span className="text-accent-red text-lg font-black leading-none">{formatPrice(card.price)}</span>
          {card.compareAtPrice != null && card.compareAtPrice > card.price && (
            <span className="text-on-primary/40 text-xs line-through">{formatPrice(card.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
