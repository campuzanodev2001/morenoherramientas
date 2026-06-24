import Link from 'next/link'
import { getAdminDashboardStats } from '@/lib/db/queries/admin-stats'

export const dynamic = 'force-dynamic'
export const revalidate = 60

function formatPrice(cents: number): string {
  return '$' + (cents / 100).toLocaleString('es-AR')
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats()

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Dashboard</h1>
        <p className="text-on-surface-variant text-sm font-medium">Resumen del día</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Órdenes nuevas" value={String(stats.newOrders)} icon="receipt_long" color="bg-primary-container" />
        <StatCard label="Ingresos del día" value={formatPrice(stats.incomeToday)} icon="payments" color="bg-green-600" />
        <StatCard label="A procesar" value={String(stats.toProcess)} icon="pending_actions" color="bg-yellow-500" />
        <StatCard label="Sin stock" value={String(stats.products.outOfStock)} icon="cancel" color="bg-accent-red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoCard label="Productos totales" value={String(stats.products.total)} icon="inventory_2" />
        <InfoCard label="Productos activos" value={String(stats.products.active)} icon="check_circle" />
        <InfoCard label="Productos inactivos" value={String(stats.products.inactive)} icon="visibility_off" />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-black uppercase text-on-surface tracking-wider border-l-4 border-accent-red pl-3">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <QuickAction href="/admin/productos/nuevo" icon="add" label="Nuevo producto" />
          <QuickAction href="/admin/productos" icon="inventory_2" label="Productos" />
          <QuickAction href="/admin/categorias" icon="category" label="Categorías" />
          <QuickAction href="/admin/banners" icon="image" label="Banners" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className={`${color} p-4 flex flex-col gap-2`}>
      <span className="material-symbols-outlined text-on-primary text-2xl">{icon}</span>
      <div>
        <p className="text-2xl font-black text-on-primary leading-none">{value}</p>
        <p className="text-on-primary/70 text-xs font-bold uppercase mt-1">{label}</p>
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-surface-container-lowest border border-surface-container p-4 flex items-center gap-3">
      <span className="material-symbols-outlined text-primary-container text-2xl">{icon}</span>
      <div>
        <p className="text-sm font-black text-on-surface">{value}</p>
        <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      </div>
    </div>
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
