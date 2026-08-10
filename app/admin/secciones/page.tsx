import { getHomeConfig } from '@/lib/db/queries/store-settings'
import { getProductOptionsByIds } from '@/lib/db/queries/admin-products'
import SectionsManager from './SectionsManager'

export const dynamic = 'force-dynamic'

export default async function SeccionesAdminPage() {
  const { sections } = await getHomeConfig()
  const selectedIds = [...new Set(sections.flatMap((s) => s.productIds))]
  const knownProducts = await getProductOptionsByIds(selectedIds)

  return <SectionsManager sections={sections} knownProducts={knownProducts} />
}
