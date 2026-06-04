'use client'

import { useRouter } from 'next/navigation'
import { useAdmin } from '@/app/context/AdminContext'
import ProductForm from '../ProductForm'
import type { Product } from '@/lib/products'

export default function NewProductPage() {
  const router = useRouter()
  const { addProduct } = useAdmin()

  function handleSubmit(data: Omit<Product, 'id'>) {
    addProduct(data)
    router.push('/admin/productos')
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">
          Nuevo producto
        </h1>
        <p className="text-on-surface-variant text-sm font-medium">
          Completá los datos del nuevo producto
        </p>
      </div>
      <ProductForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/productos')}
        submitLabel="Crear producto"
      />
    </div>
  )
}
