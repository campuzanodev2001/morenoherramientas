import { getHomeConfig } from '@/lib/db/queries/store-settings'
import HeroForm from './HeroForm'

export const dynamic = 'force-dynamic'

export default async function HeroAdminPage() {
  const { hero } = await getHomeConfig()
  return <HeroForm initial={hero} />
}
