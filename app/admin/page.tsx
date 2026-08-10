import Link from 'next/link'
import { getAdminDashboardStats } from '@/lib/db/queries/admin-stats'
import { todayInArgentina } from '@/lib/utils/date-ar'

export const dynamic = 'force-dynamic'
export const revalidate = 60

function formatPrice(cents: number): string {
  return '$' + (cents / 100).toLocaleString('es-AR')
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats()
  // Mismo "hoy" que usa el cálculo de ingresos, para que el link muestre lo contado.
  const today = todayInArgentina()

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Dashboard</h1>
        <p className="text-on-surface-variant text-sm font-medium">Resumen del día</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          href="/admin/ordenes?estado=nuevas"
          label="Órdenes nuevas"
          value={String(stats.newOrders)}
          icon="receipt_long"
          color="bg-primary-container"
        />
        <StatCard
          href={`/admin/ordenes?desde=${today}&hasta=${today}`}
          label="Ingresos del día"
          value={formatPrice(stats.incomeToday)}
          icon="payments"
          color="bg-green-600"
        />
        <StatCard
          href="/admin/ordenes?estado=confirmed"
          label="A procesar"
          value={String(stats.toProcess)}
          icon="pending_actions"
          color="bg-yellow-500"
        />
        <StatCard
          href="/admin/productos?stock=sin"
          label="Sin stock"
          value={String(stats.products.outOfStock)}
          icon="cancel"
          color="bg-accent-red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoCard href="/admin/productos" label="Productos totales" value={String(stats.products.total)} icon="inventory_2" />
        <InfoCard href="/admin/productos?estado=activos" label="Productos activos" value={String(stats.products.active)} icon="check_circle" />
        <InfoCard href="/admin/productos?estado=inactivos" label="Productos inactivos" value={String(stats.products.inactive)} icon="visibility_off" />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-black uppercase text-on-surface tracking-wider border-l-4 border-accent-red pl-3">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <QuickAction href="/admin/productos/nuevo" icon="add" label="Nuevo producto" />
          <QuickAction href="/admin/productos" icon="inventory_2" label="Productos" />
          <QuickAction href="/admin/categorias" icon="category" label="Categorías" />
          <QuickAction href="/admin/home" icon="home" label="Home" />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  href,
  label,
  value,
  icon,
  color,
}: {
  href: string
  label: string
  value: string
  icon: string
  color: string
}) {
  return (
    <Link
      href={href}
      className={`${color} p-4 flex flex-col gap-2 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface transition-opacity duration-150`}
    >
      <span className="material-symbols-outlined text-on-primary text-2xl">{icon}</span>
      <div>
        <p className="text-2xl font-black text-on-primary leading-none">{value}</p>
        <p className="text-on-primary/70 text-xs font-bold uppercase mt-1">{label}</p>
      </div>
    </Link>
  )
}

function InfoCard({ href, label, value, icon }: { href: string; label: string; value: string; icon: string }) {
  return (
    <Link
      href={href}
      className="bg-surface-container-lowest border border-surface-container p-4 flex items-center gap-3 hover:border-primary-container hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container transition-colors duration-150"
    >
      <span className="material-symbols-outlined text-primary-container text-2xl">{icon}</span>
      <div>
        <p className="text-sm font-black text-on-surface">{value}</p>
        <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      </div>
    </Link>
  )
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="bg-surface-container-lowest border-2 border-primary-container text-primary-container p-3 flex flex-col items-center gap-2 hover:bg-primary-container hover:text-on-primary transition-colors duration-150 text-center"
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      <span className="text-xs font-black uppercase">{label}</span>
    </Link>
  )
}
