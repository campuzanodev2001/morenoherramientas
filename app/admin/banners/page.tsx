import { listBanners } from '@/lib/db/queries/admin-banners'
import BannersManager from './BannersManager'

export const dynamic = 'force-dynamic'

function toInput(d: Date | null): string {
  if (!d) return ''
  const date = new Date(d)
  const off = date.getTimezoneOffset()
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 16)
}

export default async function BannersAdminPage() {
  const banners = await listBanners()
  const rows = banners.map((b) => ({
    id: b.id,
    title: b.title,
    imageUrl: b.imageUrl,
    linkUrl: b.linkUrl ?? '',
    order: b.order,
    active: b.active,
    startsAt: toInput(b.startsAt),
    endsAt: toInput(b.endsAt),
  }))
  return <BannersManager banners={rows} />
}
