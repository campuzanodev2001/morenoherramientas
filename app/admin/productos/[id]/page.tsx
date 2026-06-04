'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAdmin } from '@/app/context/AdminContext'
import ProductForm from '../ProductForm'
import type { Product } from '@/lib/products'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { allProducts, updateProduct } = useAdmin()

  const productId = Number(params.id)
  const product = allProducts.find((p) => p.id === productId)

  if (!product) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-black text-on-surface uppercase">Producto no encontrado</h1>
        <Link
          href="/admin/productos"
          className="text-primary-container font-bold text-sm hover:text-accent-red transition-colors duration-150 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver a productos
        </Link>
      </div>
    )
  }

  const { id: _id, ...initialData } = product

  function handleSubmit(data: Omit<Product, 'id'>) {
    updateProduct(productId, data)
    router.push('/admin/productos')
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <Link
          href="/admin/productos"
          className="text-on-surface-variant text-xs font-bold hover:text-on-surface flex items-center gap-1 mb-2 transition-colors duration-150"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver a productos
        </Link>
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">
          Editar producto
        </h1>
        <p className="text-on-surface-variant text-sm font-medium">{product.name}</p>
      </div>
      <ProductForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/productos')}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
