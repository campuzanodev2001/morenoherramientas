'use client'

import { useAdmin } from '@/app/context/AdminContext'
import { parsePrice } from '@/app/context/CartContext'

export default function ReportesPage() {
  const { allProducts, config } = useAdmin()

  const totalProducts = allProducts.length
  const hiddenProducts = config.hiddenIds.length
  const adminProducts = config.newProducts.length
  const editedProducts = config.productOverrides.length

  const stockCounts = {
    available: allProducts.filter((p) => p.stock === 'available').length,
    low: allProducts.filter((p) => p.stock === 'low').length,
    out: allProducts.filter((p) => p.stock === 'out').length,
  }

  const groups = [...new Set(allProducts.map((p) => p.group))]

  const groupStats = groups.map((group) => {
    const groupProducts = allProducts.filter((p) => p.group === group)
    const prices = groupProducts.map((p) => parsePrice(p.price)).filter(Boolean)
    return {
      group,
      count: groupProducts.length,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      avgPrice: prices.length
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : 0,
    }
  })

  const brandCounts = allProducts.reduce<Record<string, number>>((acc, p) => {
    acc[p.brand] = (acc[p.brand] ?? 0) + 1
    return acc
  }, {})

  const topBrands = Object.entries(brandCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  const maxBrandCount = topBrands[0]?.[1] ?? 1

  function formatPrice(n: number) {
    return '$' + n.toLocaleString('es-AR')
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Reportes</h1>
        <p className="text-on-surface-variant text-sm font-medium">Análisis del catálogo de productos</p>
      </div>

      <section className="bg-surface-container-lowest border border-surface-container p-4 md:p-6 flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
          Resumen del catálogo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryItem label="Total productos" value={totalProducts} />
          <SummaryItem label="Ocultos" value={hiddenProducts} />
          <SummaryItem label="Agregados (admin)" value={adminProducts} />
          <SummaryItem label="Editados (admin)" value={editedProducts} />
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-surface-container p-4 md:p-6 flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
          Estado de stock
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { key: 'available' as const, label: 'Disponible', color: 'bg-green-500' },
            { key: 'low' as const, label: 'Poco stock', color: 'bg-yellow-500' },
            { key: 'out' as const, label: 'Sin stock', color: 'bg-accent-red' },
          ].map(({ key, label, color }) => {
            const count = stockCounts[key]
            const pct = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs font-black uppercase text-on-surface w-20 md:w-28 shrink-0">
                  {label}
                </span>
                <div className="flex-1 h-3 bg-surface-container">
                  <div className={`h-3 ${color}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-on-surface-variant w-20 text-right shrink-0">
                  {count} ({pct}%)
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-surface-container p-4 md:p-6 flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
          Distribución por grupo
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-container">
                <th className="text-left py-2 text-xs font-black uppercase text-on-surface-variant tracking-wider">
                  Grupo
                </th>
                <th className="text-right py-2 text-xs font-black uppercase text-on-surface-variant tracking-wider">
                  Productos
                </th>
                <th className="text-right py-2 text-xs font-black uppercase text-on-surface-variant tracking-wider hidden md:table-cell">
                  Precio mín.
                </th>
                <th className="text-right py-2 text-xs font-black uppercase text-on-surface-variant tracking-wider hidden md:table-cell">
                  Precio máx.
                </th>
                <th className="text-right py-2 text-xs font-black uppercase text-on-surface-variant tracking-wider">
                  Promedio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {groupStats.map((stat) => (
                <tr key={stat.group}>
                  <td className="py-3 text-xs font-black text-on-surface uppercase">{stat.group}</td>
                  <td className="py-3 text-right text-xs font-bold text-on-surface">{stat.count}</td>
                  <td className="py-3 text-right text-xs font-medium text-on-surface-variant hidden md:table-cell">
                    {formatPrice(stat.minPrice)}
                  </td>
                  <td className="py-3 text-right text-xs font-medium text-on-surface-variant hidden md:table-cell">
                    {formatPrice(stat.maxPrice)}
                  </td>
                  <td className="py-3 text-right text-xs font-bold text-accent-red">
                    {formatPrice(stat.avgPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-surface-container p-4 md:p-6 flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-on-surface border-b border-surface-container pb-3">
          Top 10 marcas
        </h2>
        <div className="flex flex-col gap-2">
          {topBrands.map(([brand, count]) => {
            const pct = Math.round((count / maxBrandCount) * 100)
            return (
              <div key={brand} className="flex items-center gap-3">
                <span className="text-xs font-black uppercase text-on-surface w-32 shrink-0 truncate">
                  {brand}
                </span>
                <div className="flex-1 h-2 bg-surface-container">
                  <div className="h-2 bg-primary-container" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-on-surface-variant w-8 text-right shrink-0">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface p-4 flex flex-col gap-1">
      <span className="text-2xl font-black text-on-surface">{value}</span>
      <span className="text-xs font-bold uppercase text-on-surface-variant">{label}</span>
    </div>
  )
}
