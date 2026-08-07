'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { BannerDevice } from '@/lib/db/types'
import { BANNER_ASPECT_CLASS, BANNER_WIDTH_CLASS } from '@/lib/banners/display'

export type BannerSlide = {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
}

const ROTATE_MS = 6000

/**
 * Carrusel del hero. Muestra un banner a la vez para que el alto ocupado no
 * dependa de cuántos haya cargados: así el bloque entero entra en la pantalla
 * sin importar si el cliente sube uno o seis.
 *
 * El recuadro tiene proporción fija (`BANNER_ASPECT_CLASS`) y la imagen se
 * recorta con object-cover, así que una imagen de cualquier tamaño se ve igual.
 */
export default function BannerCarousel({
  banners,
  device,
  className = '',
}: {
  banners: BannerSlide[]
  device: BannerDevice
  className?: string
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = banners.length

  useEffect(() => {
    if (count <= 1 || paused) return
    // Respeta a quien pidió menos movimiento en el sistema operativo.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS)
    return () => clearInterval(timer)
  }, [count, paused])

  if (count === 0) return null

  return (
    <div className={`flex flex-col items-center gap-2 min-h-0 ${className}`}>
      {/*
        Este wrapper es el contenedor de consulta: su alto es el espacio que
        sobró y el recuadro de adentro lo lee con cqh para no pasarse.
      */}
      {/* items-center es necesario: sin él, el stretch del flex estira el alto
          del recuadro y le gana al aspect-ratio, deformando el banner. */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center [container-type:size]">
        <div
          className={`relative ${BANNER_WIDTH_CLASS[device]} ${BANNER_ASPECT_CLASS[device]} overflow-hidden bg-charcoal`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
        {banners.map((banner, i) => {
          const content = (
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              sizes={device === 'mobile' ? '100vw' : '(max-width: 1280px) 100vw, 1280px'}
              className="object-cover"
              priority={i === 0}
            />
          )
          return (
            <div
              key={banner.id}
              aria-hidden={i !== index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {banner.linkUrl ? (
                <Link href={banner.linkUrl} tabIndex={i === index ? 0 : -1} className="block w-full h-full relative">
                  {content}
                </Link>
              ) : (
                content
                )}
              </div>
            )
          })}
        </div>
      </div>

      {count > 1 && (
        <div className="flex items-center gap-2 shrink-0" role="tablist" aria-label="Banners">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`Ver ${banner.title}`}
              onClick={() => setIndex(i)}
              className={`h-2 transition-all duration-200 ${
                i === index ? 'w-6 bg-accent-red' : 'w-2 bg-on-surface/25 hover:bg-on-surface/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
