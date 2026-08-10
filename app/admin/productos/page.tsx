import Link from 'next/link'
import {
  listProductsAdmin,
  isProductSortKey,
  isSortDirection,
  DEFAULT_PRODUCT_SORT,
  DEFAULT_PRODUCT_DIR,
  type ProductSortKey,
  type SortDirection,
} from '@/lib/db/queries/admin-products'
import { listCategoriesFlat } from '@/lib/db/queries/admin-categories'
import ProductsFilterBar from './ProductsFilterBar'
import ProductRowActions from './ProductRowActions'
import SortableHeader from './SortableHeader'

export const dynamic = 'force-dynamic'

function formatPrice(cents: number): string {
  return '$' + (cents / 100).toLocaleString('es-AR')
}

/**
 * Dirección con la que arranca cada columna al clickearla por primera vez:
 * alfabéticas de la A a la Z, numéricas y de fecha de mayor a menor.
 */
const FIRST_CLICK_DIR: Record<ProductSortKey, SortDirection> = {
  name: 'asc',
  category: 'asc',
  price: 'desc',
  stock: 'desc',
  active: 'desc',
  created: 'desc',
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
  const stock = sp.stock === 'sin' ? 'sin' : ''
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1

  const sort: ProductSortKey =
    typeof sp.sort === 'string' && isProductSortKey(sp.sort) ? sp.sort : DEFAULT_PRODUCT_SORT
  const dir: SortDirection =
    typeof sp.dir === 'string' && isSortDirection(sp.dir) ? sp.dir : DEFAULT_PRODUCT_DIR

  const [data, categories] = await Promise.all([
    listProductsAdmin({ search, categoryId, active, outOfStock: stock === 'sin', page, sort, dir }),
    listCategoriesFlat(),
  ])

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    label: `${'— '.repeat(c.depth)}${c.name}`,
  }))

  function buildHref(overrides: { page?: number; sort?: ProductSortKey; dir?: SortDirection }): string {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (categoryId) params.set('cat', categoryId)
    if (estado) params.set('estado', estado)
    if (stock) params.set('stock', stock)
    const nextSort = overrides.sort ?? sort
    const nextDir = overrides.dir ?? dir
    if (nextSort !== DEFAULT_PRODUCT_SORT || nextDir !== DEFAULT_PRODUCT_DIR) {
      params.set('sort', nextSort)
      params.set('dir', nextDir)
    }
    const nextPage = overrides.page ?? page
    if (nextPage > 1) params.set('page', String(nextPage))
    return `/admin/productos${params.toString() ? `?${params}` : ''}`
  }

  /** Clickear la columna activa invierte el orden; otra columna arranca en su dirección natural. */
  function sortHref(key: ProductSortKey): string {
    const nextDir: SortDirection =
      sort === key ? (dir === 'asc' ? 'desc' : 'asc') : FIRST_CLICK_DIR[key]
    // Vuelve a la página 1: la fila que estabas viendo ya no está en esta posición.
    return buildHref({ sort: key, dir: nextDir, page: 1 })
  }

  const dirOf = (key: ProductSortKey): SortDirection | null => (sort === key ? dir : null)

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
        initialStock={stock}
        categories={categoryOptions}
        sortParams={
          sort === DEFAULT_PRODUCT_SORT && dir === DEFAULT_PRODUCT_DIR ? null : { sort, dir }
        }
      />

      <div className="w-full bg-surface-container-lowest border border-surface-container overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary-container">
              <SortableHeader label="Producto" href={sortHref('name')} direction={dirOf('name')} />
              <SortableHeader label="Categoría" href={sortHref('category')} direction={dirOf('category')} className="hidden md:table-cell" />
              <SortableHeader label="Precio" href={sortHref('price')} direction={dirOf('price')} />
              <SortableHeader label="Stock" href={sortHref('stock')} direction={dirOf('stock')} className="hidden sm:table-cell" />
              <SortableHeader label="Estado" href={sortHref('active')} direction={dirOf('active')} />
              <th scope="col" className="px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider text-right">Acciones</th>
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
            <Link href={buildHref({ page: page - 1 })} className="text-xs font-black uppercase text-primary-container hover:underline">
              ← Anterior
            </Link>
          ) : (
            <span className="text-xs font-black uppercase text-on-surface-variant/40">← Anterior</span>
          )}
          <span className="text-xs font-bold text-on-surface-variant">
            Página {page} de {data.totalPages}
          </span>
          {page < data.totalPages ? (
            <Link href={buildHref({ page: page + 1 })} className="text-xs font-black uppercase text-primary-container hover:underline">
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
