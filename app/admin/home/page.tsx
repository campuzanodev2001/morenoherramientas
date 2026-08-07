import { listBanners } from '@/lib/db/queries/admin-banners'
import { getHomeConfig } from '@/lib/db/queries/store-settings'
import BannersManager from './BannersManager'
import SloganForm from './SloganForm'

export const dynamic = 'force-dynamic'

function toInput(d: Date | null): string {
  if (!d) return ''
  const date = new Date(d)
  const off = date.getTimezoneOffset()
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 16)
}

/**
 * Todo lo que se ve al entrar a la tienda, en una sola pantalla: el texto de
 * arriba y los banners de abajo. Antes eran dos secciones (Hero y Banners)
 * que editaban partes del mismo bloque.
 */
export default async function HomeAdminPage() {
  const [banners, config] = await Promise.all([listBanners(), getHomeConfig()])

  const rows = banners.map((b) => ({
    id: b.id,
    title: b.title,
    imageUrl: b.imageUrl,
    device: b.device,
    linkUrl: b.linkUrl ?? '',
    order: b.order,
    active: b.active,
    startsAt: toInput(b.startsAt),
    endsAt: toInput(b.endsAt),
  }))

  return (
    <div className="p-4 md:p-6 flex flex-col gap-8 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Home</h1>
        <p className="text-sm text-on-surface-variant font-medium">
          Lo primero que ve el comprador: el eslogan con el buscador arriba y los banners abajo.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-black uppercase text-on-surface tracking-wider border-l-4 border-accent-red pl-2">
          Textos
        </h2>
        <SloganForm initial={config.hero} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-black uppercase text-on-surface tracking-wider border-l-4 border-accent-red pl-2">
          Banners
        </h2>
        <BannersManager banners={rows} />
      </section>
    </div>
  )
}
