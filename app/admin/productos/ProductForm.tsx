'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { productInputSchema } from '@/lib/validations/product'
import { createProductAction, updateProductAction } from '@/lib/admin/product-actions'
import { slugify } from '@/lib/utils/slug'

type ImageItem = { url: string; alt: string; isPrimary: boolean }
type Spec = { label: string; value: string }

export type ProductFormInitial = {
  id: string
  name: string
  slug: string
  sku: string
  barcode: string
  brand: string
  categoryId: string
  price: number
  compareAtPrice: number | ''
  stock: number
  description: string
  active: boolean
  specs: Spec[]
  images: ImageItem[]
}

type CategoryOption = { id: string; label: string }

const empty: ProductFormInitial = {
  id: '',
  name: '',
  slug: '',
  sku: '',
  barcode: '',
  brand: '',
  categoryId: '',
  price: 0,
  compareAtPrice: '',
  stock: 0,
  description: '',
  active: true,
  specs: [],
  images: [],
}

async function uploadToCloudinary(file: File, onProgress: (pct: number) => void): Promise<string> {
  const signRes = await fetch('/api/admin/cloudinary/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'productos' }),
  })
  if (!signRes.ok) throw new Error('No se pudo autorizar la subida')
  const { signature, timestamp, folder, cloudName, apiKey } = await signRes.json()

  const form = new FormData()
  form.append('file', file)
  form.append('api_key', apiKey)
  form.append('timestamp', String(timestamp))
  form.append('folder', folder)
  form.append('signature', signature)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).secure_url)
      else reject(new Error('Error al subir la imagen'))
    }
    xhr.onerror = () => reject(new Error('Error de red al subir'))
    xhr.send(form)
  })
}

export default function ProductForm({
  categories,
  initial,
}: {
  categories: CategoryOption[]
  initial?: ProductFormInitial
}) {
  const router = useRouter()
  const base = initial ?? empty
  const isEdit = Boolean(initial)

  const [name, setName] = useState(base.name)
  const [slug, setSlug] = useState(base.slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(base.slug))
  const [sku, setSku] = useState(base.sku)
  const [barcode, setBarcode] = useState(base.barcode)
  const [brand, setBrand] = useState(base.brand)
  const [categoryId, setCategoryId] = useState(base.categoryId)
  const [price, setPrice] = useState(String(base.price))
  const [compareAtPrice, setCompareAtPrice] = useState(base.compareAtPrice === '' ? '' : String(base.compareAtPrice))
  const [stock, setStock] = useState(String(base.stock))
  const [description, setDescription] = useState(base.description)
  const [active, setActive] = useState(base.active)
  const [specs, setSpecs] = useState<Spec[]>(base.specs)
  const [images, setImages] = useState<ImageItem[]>(base.images)

  const [uploads, setUploads] = useState<{ name: string; pct: number }[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function onNameChange(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function setPrimary(idx: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })))
  }
  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }
  function moveImage(idx: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      const a = next[idx]
      const b = next[target]
      if (!a || !b) return prev
      next[idx] = b
      next[target] = a
      return next
    })
  }

  async function onFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      const key = file.name + Date.now()
      setUploads((u) => [...u, { name: key, pct: 0 }])
      try {
        const url = await uploadToCloudinary(file, (pct) =>
          setUploads((u) => u.map((it) => (it.name === key ? { ...it, pct } : it))),
        )
        setImages((prev) => [...prev, { url, alt: '', isPrimary: prev.length === 0 }])
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Error al subir imagen')
      } finally {
        setUploads((u) => u.filter((it) => it.name !== key))
      }
    }
  }

  function updateSpec(idx: number, field: keyof Spec, value: string) {
    setSpecs((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})

    const input = {
      name,
      slug,
      sku,
      barcode,
      brand,
      categoryId: categoryId || null,
      price: Number(price),
      compareAtPrice: compareAtPrice === '' ? null : Number(compareAtPrice),
      stock: Number(stock),
      description,
      specs: specs.filter((s) => s.label.trim() && s.value.trim()),
      images,
      active,
    }

    const parsed = productInputSchema.safeParse(input)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0])
        if (!errs[key]) errs[key] = issue.message
      }
      setFieldErrors(errs)
      return
    }

    setSubmitting(true)
    const result = isEdit ? await updateProductAction(base.id, input) : await createProductAction(input)
    setSubmitting(false)

    if (!result.success) {
      if (result.fields) {
        const errs: Record<string, string> = {}
        for (const f of result.fields) errs[f.field] = f.message
        setFieldErrors(errs)
      } else {
        setFormError(result.error)
      }
      return
    }
    router.push('/admin/productos')
    router.refresh()
  }

  const stockZero = Number(stock) <= 0
  const inputClass =
    'border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container w-full'
  const labelClass = 'text-xs font-black uppercase text-on-surface tracking-wider'

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 flex flex-col gap-6 max-w-3xl" noValidate>
      <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">
        {isEdit ? 'Editar producto' : 'Nuevo producto'}
      </h1>

      {formError && <p className="text-sm text-red-600 font-medium bg-red-50 p-3">{formError}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nombre" error={fieldErrors.name} className="md:col-span-2">
          <input className={inputClass} value={name} onChange={(e) => onNameChange(e.target.value)} />
        </Field>

        <Field label="Slug (URL)" error={fieldErrors.slug} className="md:col-span-2">
          <input
            className={inputClass}
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugTouched(true)
            }}
            placeholder="se-genera-del-nombre"
          />
        </Field>

        <Field label="SKU" error={fieldErrors.sku}>
          <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} />
        </Field>
        <Field label="Código de barras" error={fieldErrors.barcode}>
          <input className={inputClass} value={barcode} onChange={(e) => setBarcode(e.target.value)} />
        </Field>

        <Field label="Marca" error={fieldErrors.brand}>
          <input className={inputClass} value={brand} onChange={(e) => setBrand(e.target.value)} />
        </Field>
        <Field label="Categoría" error={fieldErrors.categoryId}>
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Precio (pesos)" error={fieldErrors.price}>
          <input className={inputClass} type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Precio comparativo (opcional)" error={fieldErrors.compareAtPrice}>
          <input
            className={inputClass}
            type="number"
            min="0"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
          />
        </Field>

        <Field label="Stock" error={fieldErrors.stock}>
          <input className={inputClass} type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
        </Field>
        <Field label="Estado">
          <label className="flex items-center gap-2 h-full">
            <input
              type="checkbox"
              checked={active && !stockZero}
              disabled={stockZero}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span className="text-sm font-bold text-on-surface">{active && !stockZero ? 'Activo' : 'Inactivo'}</span>
          </label>
        </Field>
      </div>

      {stockZero && (
        <p className="text-xs font-bold text-yellow-700 bg-yellow-50 p-2">
          ⚠ Con stock 0 el producto se guarda como inactivo automáticamente.
        </p>
      )}

      <Field label="Descripción" error={fieldErrors.description}>
        <textarea className={`${inputClass} min-h-28`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Especificaciones técnicas</span>
        <div className="flex flex-col gap-2">
          {specs.map((spec, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Característica"
                value={spec.label}
                onChange={(e) => updateSpec(i, 'label', e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Valor"
                value={spec.value}
                onChange={(e) => updateSpec(i, 'value', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setSpecs((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-on-surface-variant hover:text-accent-red px-2"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSpecs((prev) => [...prev, { label: '', value: '' }])}
          className="text-xs font-black uppercase text-primary-container hover:underline self-start"
        >
          + Agregar fila
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Imágenes</span>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={img.url} className="w-28 border-2 border-surface-container p-1 flex flex-col gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-24 object-cover" />
              <label className="flex items-center gap-1 text-[10px] font-bold">
                <input type="radio" name="primary" checked={img.isPrimary} onChange={() => setPrimary(i)} />
                Principal
              </label>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => moveImage(i, -1)} className="text-on-surface-variant" title="Mover izquierda">
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                </button>
                <button type="button" onClick={() => removeImage(i)} className="text-accent-red" title="Quitar">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
                <button type="button" onClick={() => moveImage(i, 1)} className="text-on-surface-variant" title="Mover derecha">
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        {uploads.map((u) => (
          <div key={u.name} className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-surface-container">
              <div className="h-2 bg-primary-container" style={{ width: `${u.pct}%` }} />
            </div>
            <span className="text-xs text-on-surface-variant">{u.pct}%</span>
          </div>
        ))}
        <label className="text-xs font-black uppercase text-primary-container hover:underline cursor-pointer self-start">
          + Subir imágenes
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || uploads.length > 0}
          className="bg-primary-container text-on-primary font-black uppercase py-3 px-6 disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/productos')}
          className="border-2 border-outline text-on-surface font-black uppercase py-3 px-6"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  className = '',
  children,
}: {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-black uppercase text-on-surface tracking-wider">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </div>
  )
}
