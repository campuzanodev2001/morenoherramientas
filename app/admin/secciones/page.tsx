import { getHomeConfig } from '@/lib/db/queries/store-settings'
import { listProductsAdmin } from '@/lib/db/queries/admin-products'
import SectionsForm from './SectionsForm'

export const dynamic = 'force-dynamic'

export default async function SeccionesAdminPage() {
  const [{ sections }, productPage] = await Promise.all([
    getHomeConfig(),
    listProductsAdmin({ active: true, limit: 100 }),
  ])
  const products = productPage.rows.map((p) => ({ id: p.id, name: p.name, sku: p.sku }))
  return <SectionsForm initial={sections} products={products} />
}
