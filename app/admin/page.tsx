'use client'

import Link from 'next/link'
import { useAdmin } from '@/app/context/AdminContext'

export default function AdminDashboardPage() {
  const { allProducts, config } = useAdmin()

  const activeCount = allProducts.length
  const hiddenCount = config.hiddenIds.length
  const newCount = config.newProducts.length
  const outOfStockCount = allProducts.filter((p) => p.stock === 'out').length
  const lowStockCount = allProducts.filter((p) => p.stock === 'low').length
  const availableCount = allProducts.filter((p) => p.stock === 'available').length

  const groups = [...new Set(allProducts.map((p) => p.group))]

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Dashboard</h1>
        <p className="text-on-surface-variant text-sm font-medium">Resumen del catálogo</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Productos activos" value={activeCount} icon="inventory_2" color="bg-primary-container" />
        <StatCard label="Disponibles" value={availableCount} icon="check_circle" color="bg-green-600" />
        <StatCard label="Poco stock" value={lowStockCount} icon="warning" color="bg-yellow-500" />
        <StatCard label="Sin stock" value={outOfStockCount} icon="cancel" color="bg-accent-red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoCard
          label="Productos ocultos"
          value={`${hiddenCount} producto${hiddenCount !== 1 ? 's' : ''}`}
          icon="visibility_off"
        />
        <InfoCard
          label="Productos nuevos (admin)"
          value={`${newCount} producto${newCount !== 1 ? 's' : ''}`}
          icon="add_circle"
        />
        <InfoCard
          label="Grupos en catálogo"
          value={`${groups.length} grupo${groups.length !== 1 ? 's' : ''}`}
          icon="category"
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-black uppercase text-on-surface tracking-wider border-l-4 border-accent-red pl-3">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <QuickAction href="/admin/productos/nuevo" icon="add" label="Nuevo producto" />
          <QuickAction href="/admin/secciones" icon="view_quilt" label="Editar secciones" />
          <QuickAction href="/admin/hero" icon="image" label="Editar hero" />
          <QuickAction href="/admin/reportes" icon="bar_chart" label="Ver reportes" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-black uppercase text-on-surface tracking-wider border-l-4 border-accent-red pl-3">
          Productos por grupo
        </h2>
        <div className="bg-surface-container-lowest border border-surface-container flex flex-col divide-y divide-surface-container">
          {groups.map((group) => {
            const count = allProducts.filter((p) => p.group === group).length
            const pct = Math.round((count / activeCount) * 100)
            return (
              <div key={group} className="px-4 py-3 flex items-center gap-4">
                <span className="text-xs font-black uppercase text-on-surface w-28 md:w-52 shrink-0 truncate">
                  {group}
                </span>
                <div className="flex-1 h-2 bg-surface-container">
                  <div className="h-2 bg-primary-container" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-on-surface-variant w-20 text-right shrink-0">
                  {count} ({pct}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: string
  color: string
}) {
  return (
    <div className={`${color} p-4 flex flex-col gap-2`}>
      <span className="material-symbols-outlined text-on-primary text-2xl">{icon}</span>
      <div>
        <p className="text-3xl font-black text-on-primary leading-none">{value}</p>
        <p className="text-on-primary/70 text-xs font-bold uppercase mt-1">{label}</p>
      </div>
    </div>
  )
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) {
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
