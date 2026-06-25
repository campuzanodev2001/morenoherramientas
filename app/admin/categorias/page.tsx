import { listCategoriesWithCounts } from '@/lib/db/queries/admin-categories'
import CategoriesManager from './CategoriesManager'

export const dynamic = 'force-dynamic'

export default async function CategoriasAdminPage() {
  const categories = await listCategoriesWithCounts()
  return <CategoriesManager categories={categories} />
}
