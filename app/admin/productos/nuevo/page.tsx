import { listCategoriesFlat } from '@/lib/db/queries/admin-categories'
import ProductForm from '../ProductForm'

export const dynamic = 'force-dynamic'

export default async function NuevoProductoPage() {
  const categories = await listCategoriesFlat()
  const options = categories.map((c) => ({ id: c.id, label: `${'— '.repeat(c.depth)}${c.name}` }))
  return <ProductForm categories={options} />
}
