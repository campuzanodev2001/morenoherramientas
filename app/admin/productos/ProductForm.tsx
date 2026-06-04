'use client'

import { useState } from 'react'
import type { Product, StockStatus } from '@/lib/products'

type ProductFormData = Omit<Product, 'id'>

type ProductFormProps = {
  initialData?: ProductFormData
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
  submitLabel: string
}

const GROUPS = [
  'AUTOMOTRIZ',
  'HERRAMIENTAS ELÉCTRICAS',
  'HERRAMIENTAS DE MANO',
  'TALLER Y EQUIPAMIENTO',
  'CONSUMIBLES',
]

const STOCK_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'low', label: 'Poco stock' },
  { value: 'out', label: 'Sin stock' },
]

const emptyForm: ProductFormData = {
  name: '',
  brand: '',
  sku: '',
  price: '',
  stock: 'available',
  images: [''],
  description: '',
  specs: [{ label: '', value: '' }],
  category: '',
  subcategory: '',
  group: GROUPS[0],
}

const inputClass =
  'border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container w-full'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-black uppercase text-on-surface tracking-wider">
        {label}
        {required && <span className="text-accent-red ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(initialData ?? emptyForm)

  function updateField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateImage(index: number, value: string) {
    const updated = [...form.images]
    updated[index] = value
    updateField('images', updated)
  }

  function addImage() {
    updateField('images', [...form.images, ''])
  }

  function removeImage(index: number) {
    updateField('images', form.images.filter((_, i) => i !== index))
  }

  function updateSpec(index: number, key: 'label' | 'value', value: string) {
    updateField(
      'specs',
      form.specs.map((spec, i) => (i === index ? { ...spec, [key]: value } : spec))
    )
  }

  function addSpec() {
    updateField('specs', [...form.specs, { label: '', value: '' }])
  }

  function removeSpec(index: number) {
    updateField('specs', form.specs.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      images: form.images.filter((url) => url.trim() !== ''),
      specs: form.specs.filter((s) => s.label.trim() !== '' || s.value.trim() !== ''),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="bg-surface-container-lowest border border-surface-container p-6 flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
          Información básica
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Marca" required>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="SKU" required>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => updateField('sku', e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Precio (ej: $145.000)" required>
            <input
              type="text"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              required
              placeholder="$145.000"
              className={inputClass}
            />
          </Field>
          <Field label="Estado de stock">
            <select
              value={form.stock}
              onChange={(e) => updateField('stock', e.target.value as StockStatus)}
              className={inputClass}
            >
              {STOCK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-surface-container p-6 flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
          Clasificación
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Grupo">
            <select
              value={form.group}
              onChange={(e) => updateField('group', e.target.value)}
              className={inputClass}
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Categoría" required>
            <input
              type="text"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Subcategoría">
            <input
              type="text"
              value={form.subcategory}
              onChange={(e) => updateField('subcategory', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-surface-container p-6 flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
          Descripción
        </h2>
        <textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={4}
          className={`${inputClass} resize-none`}
          placeholder="Descripción detallada del producto..."
        />
      </section>

      <section className="bg-surface-container-lowest border border-surface-container p-6 flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
          Imágenes (URLs)
        </h2>
        <div className="flex flex-col gap-2">
          {form.images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateImage(i, e.target.value)}
                placeholder="https://..."
                className={`${inputClass} flex-1`}
              />
              {form.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="bg-surface-container text-on-surface-variant hover:bg-accent-red hover:text-on-primary px-3 transition-colors duration-150"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addImage}
            className="flex items-center gap-2 text-xs font-black uppercase text-primary-container hover:text-accent-red transition-colors duration-150 self-start mt-1"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Agregar imagen
          </button>
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-surface-container p-6 flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
          Especificaciones técnicas
        </h2>
        <div className="flex flex-col gap-2">
          {form.specs.map((spec, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={spec.label}
                onChange={(e) => updateSpec(i, 'label', e.target.value)}
                placeholder="Característica"
                className={`${inputClass} flex-1`}
              />
              <input
                type="text"
                value={spec.value}
                onChange={(e) => updateSpec(i, 'value', e.target.value)}
                placeholder="Valor"
                className={`${inputClass} flex-1`}
              />
              {form.specs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSpec(i)}
                  className="bg-surface-container text-on-surface-variant hover:bg-accent-red hover:text-on-primary px-3 transition-colors duration-150"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSpec}
            className="flex items-center gap-2 text-xs font-black uppercase text-primary-container hover:text-accent-red transition-colors duration-150 self-start mt-1"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Agregar especificación
          </button>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="border-2 border-outline text-on-surface-variant font-black text-sm py-3 px-6 uppercase tracking-widest hover:border-on-surface hover:text-on-surface transition-colors duration-150"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-primary-container text-on-primary font-black text-sm py-3 px-8 uppercase tracking-widest hover:bg-primary transition-colors duration-150"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
