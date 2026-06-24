import { notFound } from 'next/navigation'
import { getProductForAdmin } from '@/lib/db/queries/admin-products'
import { listCategoriesFlat } from '@/lib/db/queries/admin-categories'
import ProductForm, { type ProductFormInitial } from '../ProductForm'

export const dynamic = 'force-dynamic'

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, categories] = await Promise.all([getProductForAdmin(id), listCategoriesFlat()])
  if (!product) notFound()

  const initial: ProductFormInitial = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
    brand: product.brand ?? '',
    categoryId: product.categoryId ?? '',
    price: product.price / 100,
    compareAtPrice: product.compareAtPrice != null ? product.compareAtPrice / 100 : '',
    stock: product.stock,
    description: product.description ?? '',
    active: product.active,
    specs: product.specs,
    images: product.images.map((img) => ({ url: img.url, alt: img.alt ?? '', isPrimary: img.isPrimary })),
  }

  const options = categories.map((c) => ({ id: c.id, label: `${'— '.repeat(c.depth)}${c.name}` }))
  return <ProductForm categories={options} initial={initial} />
}
