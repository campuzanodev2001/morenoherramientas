'use client'

import Image from 'next/image'
import { useState } from 'react'

const PLACEHOLDER = '/file.svg'

export default function ProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const gallery = images.length > 0 ? images : [PLACEHOLDER]
  const [selectedIndex, setSelectedIndex] = useState(0)
  const current = gallery[selectedIndex] ?? PLACEHOLDER

  return (
    <div className="flex flex-col gap-3 min-w-0 w-full">
      <div className="relative aspect-square border-2 border-charcoal bg-surface-container overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
        <Image src={current} alt={productName} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-6" priority />
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((src, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative w-16 h-16 flex-shrink-0 border-2 overflow-hidden transition-all duration-150 ${
                selectedIndex === index ? 'border-accent-red' : 'border-outline hover:border-primary-container'
              }`}
            >
              <Image src={src} alt={`Vista ${index + 1}`} fill sizes="64px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
