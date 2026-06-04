'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/app/context/AdminContext'

export default function HeroPage() {
  const { config, updateHero } = useAdmin()
  const [imageUrl, setImageUrl] = useState(config.hero.imageUrl)
  const [title, setTitle] = useState(config.hero.title)
  const [ctaText, setCtaText] = useState(config.hero.ctaText)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setImageUrl(config.hero.imageUrl)
    setTitle(config.hero.title)
    setCtaText(config.hero.ctaText)
  }, [config.hero])

  function handleSave() {
    updateHero({ imageUrl, title, ctaText })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function markDirty() {
    setSaved(false)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Hero</h1>
          <p className="text-on-surface-variant text-sm font-medium">
            Configurá la sección principal de la página de inicio
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`font-black text-xs py-3 px-5 uppercase tracking-widest flex items-center gap-2 transition-colors duration-150 ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-primary-container text-on-primary hover:bg-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">{saved ? 'check' : 'save'}</span>
          {saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface-container-lowest border border-surface-container p-6 flex flex-col gap-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
            Configuración
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase text-on-surface tracking-wider">
              URL de la imagen de fondo
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value)
                markDirty()
              }}
              placeholder="https://..."
              className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container"
            />
            <p className="text-xs text-on-surface-variant">
              Recomendado: imagen de alta resolución (mínimo 1280×600 px).
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase text-on-surface tracking-wider">
              Título principal
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                markDirty()
              }}
              className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase text-on-surface tracking-wider">
              Texto del botón CTA
            </label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => {
                setCtaText(e.target.value)
                markDirty()
              }}
              className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container"
            />
            <p className="text-xs text-on-surface-variant">
              Texto que aparece debajo del título en el hero.
            </p>
          </div>
        </section>

        <section className="bg-surface-container-lowest border border-surface-container p-6 flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
            Vista previa
          </h2>
          <div
            className="relative h-52 bg-charcoal overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: imageUrl ? `url('${imageUrl}')` : undefined }}
          >
            <div className="absolute inset-0 bg-primary-container/35" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
              <h2 className="text-on-primary font-black text-lg uppercase text-center drop-shadow-lg leading-tight">
                {title || 'Título del hero'}
              </h2>
              <div className="bg-primary-container text-on-primary text-xs font-black py-2 px-4 uppercase tracking-widest shadow-lg">
                {ctaText || 'Texto CTA'}
              </div>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant">
            Vista previa aproximada. El resultado final puede variar levemente.
          </p>
        </section>
      </div>
    </div>
  )
}
