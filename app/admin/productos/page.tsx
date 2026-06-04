'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAdmin } from '@/app/context/AdminContext'

const STOCK_LABELS: Record<string, string> = {
  available: 'Disponible',
  low: 'Poco stock',
  out: 'Sin stock',
}

const STOCK_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  low: 'bg-yellow-100 text-yellow-800',
  out: 'bg-red-100 text-red-800',
}

export default function ProductsAdminPage() {
  const { allProducts, config, deleteProduct } = useAdmin()
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const groups = [...new Set(allProducts.map((p) => p.group))]

  const filtered = allProducts.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    const matchesGroup = !groupFilter || p.group === groupFilter
    return matchesSearch && matchesGroup
  })

  function isAdminAdded(productId: number) {
    return config.newProducts.some((p) => p.id === productId)
  }

  function isModified(productId: number) {
    return config.productOverrides.some((o) => o.id === productId)
  }

  function handleDelete(id: number) {
    if (confirmDelete === id) {
      deleteProduct(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
    }
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Productos</h1>
          <p className="text-on-surface-variant text-sm font-medium">
            {filtered.length} de {allProducts.length} productos
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="bg-primary-container text-on-primary font-black text-xs py-3 px-5 uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-colors duration-150"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo producto
        </Link>
      </div>

      <div className="flex gap-2 flex-col md:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, marca o SKU..."
          className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container flex-1"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="border-2 border-outline px-3 py-2.5 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container md:w-64"
        >
          <option value="">Todos los grupos</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full bg-surface-container-lowest border border-surface-container overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary-container">
              <th className="text-left px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider">
                Producto
              </th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider hidden md:table-cell">
                Grupo
              </th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider">
                Precio
              </th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider hidden sm:table-cell">
                Stock
              </th>
              <th className="px-4 py-3 text-xs font-black uppercase text-on-surface tracking-wider text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-surface transition-colors duration-100">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-on-surface text-xs uppercase truncate max-w-[200px]">
                        {product.name}
                      </span>
                      {isAdminAdded(product.id) && (
                        <span className="text-[10px] font-bold bg-primary-container text-on-primary px-1.5 py-0.5 uppercase shrink-0">
                          Nuevo
                        </span>
                      )}
                      {isModified(product.id) && !isAdminAdded(product.id) && (
                        <span className="text-[10px] font-bold bg-yellow-500 text-white px-1.5 py-0.5 uppercase shrink-0">
                          Editado
                        </span>
                      )}
                    </div>
                    <span className="text-on-surface-variant text-xs font-medium">
                      {product.brand} · {product.sku}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs font-bold text-on-surface-variant uppercase">
                    {product.group}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-accent-red font-black text-sm">{product.price}</span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span
                    className={`text-xs font-bold px-2 py-1 uppercase ${STOCK_COLORS[product.stock]}`}
                  >
                    {STOCK_LABELS[product.stock]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="text-on-surface-variant hover:text-primary-container p-1.5 transition-colors duration-150"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className={`p-1.5 transition-colors duration-150 ${
                        confirmDelete === product.id
                          ? 'text-on-primary bg-accent-red'
                          : 'text-on-surface-variant hover:text-accent-red'
                      }`}
                      title={
                        confirmDelete === product.id ? 'Confirmar eliminación' : 'Eliminar'
                      }
                    >
                      <span className="material-symbols-outlined text-lg">
                        {confirmDelete === product.id ? 'warning' : 'delete'}
                      </span>
                    </button>
                    {confirmDelete === product.id && (
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-on-surface-variant hover:text-on-surface p-1.5 transition-colors duration-150"
                        title="Cancelar"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-on-surface-variant text-sm font-medium">
            No se encontraron productos
          </div>
        )}
      </div>
    </div>
  )
}
