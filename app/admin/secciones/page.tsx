'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/app/context/AdminContext'

export default function SeccionesPage() {
  const { allProducts, config, updateSections } = useAdmin()
  const [featuredTitle, setFeaturedTitle] = useState(config.sections.featuredTitle)
  const [featuredIds, setFeaturedIds] = useState<number[]>(config.sections.featuredProductIds)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setFeaturedTitle(config.sections.featuredTitle)
    setFeaturedIds(config.sections.featuredProductIds)
  }, [config.sections])

  function toggleFeatured(id: number) {
    setFeaturedIds((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    )
    setSaved(false)
  }

  function handleSave() {
    updateSections({ featuredTitle, featuredProductIds: featuredIds })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const filteredProducts = allProducts.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  )

  const featuredProducts =
    featuredIds.length > 0
      ? allProducts.filter((p) => featuredIds.includes(p.id))
      : allProducts.slice(0, 4)

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Secciones</h1>
          <p className="text-on-surface-variant text-sm font-medium">
            Configurá los nombres y el contenido de cada sección
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

      <section className="bg-surface-container-lowest border border-surface-container p-4 md:p-6 flex flex-col gap-5">
        <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
          Sección "Productos destacados"
        </h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase text-on-surface tracking-wider">
            Título de la sección
          </label>
          <input
            type="text"
            value={featuredTitle}
            onChange={(e) => {
              setFeaturedTitle(e.target.value)
              setSaved(false)
            }}
            className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container max-w-sm"
          />
          <p className="text-xs text-on-surface-variant">
            Este título aparece en la página principal sobre los productos destacados.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <label className="text-xs font-black uppercase text-on-surface tracking-wider block">
                Productos a mostrar
              </label>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {featuredIds.length === 0
                  ? 'Se muestran automáticamente los primeros 4 productos.'
                  : `${featuredIds.length} producto${featuredIds.length !== 1 ? 's' : ''} seleccionado${featuredIds.length !== 1 ? 's' : ''}.`}
              </p>
            </div>
            {featuredIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFeaturedIds([])
                  setSaved(false)
                }}
                className="text-xs font-bold text-on-surface-variant hover:text-accent-red transition-colors duration-150 underline"
              >
                Limpiar selección
              </button>
            )}
          </div>

          {featuredIds.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-black uppercase text-on-surface-variant">
                Vista previa:
              </p>
              <div className="flex flex-col gap-1">
                {featuredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-surface px-3 py-2 border border-surface-container"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-on-surface uppercase truncate block">{p.name}</span>
                      <span className="text-xs text-on-surface-variant">{p.brand}</span>
                    </div>
                    <span className="text-accent-red text-sm font-bold shrink-0 ml-2">{p.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container"
          />

          <div className="border border-surface-container max-h-72 overflow-y-auto">
            {filteredProducts.map((product) => {
              const isSelected = featuredIds.includes(product.id)
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleFeatured(product.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100 border-b border-surface-container last:border-b-0 ${
                    isSelected ? 'bg-primary-container/10' : 'hover:bg-surface'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-lg shrink-0 ${
                      isSelected ? 'text-primary-container' : 'text-on-surface-variant'
                    }`}
                    style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    check_box
                  </span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-black text-on-surface uppercase truncate">
                      {product.name}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {product.brand} · {product.group}
                    </span>
                  </div>
                  <span className="text-accent-red text-xs font-bold shrink-0">{product.price}</span>
                </button>
              )
            })}
            {filteredProducts.length === 0 && (
              <div className="py-6 text-center text-on-surface-variant text-xs font-medium">
                No se encontraron productos
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
