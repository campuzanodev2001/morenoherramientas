import Link from 'next/link'
import { listProductsAdmin } from '@/lib/db/queries/admin-products'
import { listCategoriesFlat } from '@/lib/db/queries/admin-categories'
import ProductsFilterBar from './ProductsFilterBar'
import ProductRowActions from './ProductRowActions'

export const dynamic = 'force-dynamic'

function formatPrice(cents: number): string {
  return '$' + (cents / 100).toLocaleString('es-AR')
}

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const search = typeof sp.q === 'string' ? sp.q : ''
  const categoryId = typeof sp.cat === 'string' && sp.cat ? sp.cat : undefined
  const estado = typeof sp.estado === 'string' ? sp.estado : ''
  const active = estado === 'activos' ? true : estado === 'inactivos' ? false : undefined
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1

  const [data, categories] = await Promise.all([
    listProductsAdmin({ search, categoryId, active, page }),
    listCategoriesFlat(),
  ])

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    label: `${'— '.repeat(c.depth)}${c.name}`,
  }))

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (categoryId) params.set('cat', categoryId)
    if (estado) params.set('estado', estado)
    params.set('page', String(p))
    return `/admin/productos?${params}`
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Productos</h1>
          <p className="text-on-surface-variant text-sm font-medium">{data.total} productos</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="bg-primary-container text-on-primary font-black text-xs py-3 px-5 uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-colors duration-150"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo producto
        </Link>
      </div>

      <ProductsFilterBar
        initialSearch={search}
        initialCategory={categoryId ?? ''}
        initialEstado={estado}
        categories={categoryOptions}
      />

      <div className="w-full bg-surface-container-lowest border border-surface-container overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary-container">
              <th className="text-left px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider">Producto</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider hidden md:table-cell">Categoría</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider">Precio</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider hidden sm:table-cell">Stock</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider">Estado</th>
              <th className="px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {data.rows.map((p) => (
              <tr key={p.id} className="hover:bg-surface transition-colors duration-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.primaryImageUrl ?? '/file.svg'}
                      alt=""
                      className="w-10 h-10 object-cover bg-surface-container shrink-0"
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-black text-on-surface text-xs uppercase truncate max-w-[200px]">{p.name}</span>
                      <span className="text-on-surface-variant text-xs font-medium">
                        {p.brand ?? '—'} · {p.sku ?? 's/sku'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs font-bold text-on-surface-variant uppercase">{p.categoryName ?? '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-accent-red font-black text-sm">{formatPrice(p.price)}</span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs font-bold ${p.stock === 0 ? 'text-accent-red' : 'text-on-surface'}`}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-bold px-2 py-1 uppercase ${
                      p.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {p.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ProductRowActions id={p.id} active={p.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.rows.length === 0 && (
          <div className="py-12 text-center text-on-surface-variant text-sm font-medium">
            No se encontraron productos
          </div>
        )}
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-xs font-black uppercase text-primary-container hover:underline">
              ← Anterior
            </Link>
          ) : (
            <span className="text-xs font-black uppercase text-on-surface-variant/40">← Anterior</span>
          )}
          <span className="text-xs font-bold text-on-surface-variant">
            Página {page} de {data.totalPages}
          </span>
          {page < data.totalPages ? (
            <Link href={pageHref(page + 1)} className="text-xs font-black uppercase text-primary-container hover:underline">
              Siguiente →
            </Link>
          ) : (
            <span className="text-xs font-black uppercase text-on-surface-variant/40">Siguiente →</span>
          )}
        </div>
      )}
    </div>
  )
}
