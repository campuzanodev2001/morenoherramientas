'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
  { href: '/admin/ordenes', label: 'Órdenes', icon: 'receipt_long', exact: false },
  { href: '/admin/productos', label: 'Productos', icon: 'inventory_2', exact: false },
  { href: '/admin/categorias', label: 'Categorías', icon: 'category', exact: false },
  { href: '/admin/banners', label: 'Banners', icon: 'image', exact: false },
  { href: '/admin/secciones', label: 'Secciones', icon: 'view_quilt', exact: false },
  { href: '/admin/hero', label: 'Hero', icon: 'wallpaper', exact: false },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`w-64 bg-primary-container flex flex-col min-h-screen fixed left-0 top-0 bottom-0 z-40 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-white/10">
          <Link
            href="/"
            className="text-on-primary/60 text-xs font-bold hover:text-on-primary flex items-center gap-1 transition-colors duration-150"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Ver tienda
          </Link>
          <h1 className="text-on-primary text-base font-black uppercase mt-2 tracking-tight">Panel Admin</h1>
          <p className="text-on-primary/50 text-xs font-medium uppercase">Moreno Herramientas</p>
        </div>
        <nav className="flex flex-col flex-grow p-2 gap-0.5">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-colors duration-150 ${
                  isActive
                    ? 'bg-accent-red text-on-primary'
                    : 'text-on-primary/70 hover:bg-white/10 hover:text-on-primary'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-on-primary/50 hover:text-on-primary text-xs font-black uppercase tracking-wider transition-colors duration-150 w-full"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex flex-col md:ml-64 min-h-screen">
        <div className="md:hidden bg-primary-container flex items-center gap-3 px-4 py-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-on-primary" aria-label="Abrir menú">
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <span className="text-on-primary font-black text-sm uppercase tracking-tight">Panel Admin</span>
        </div>
        <main className="flex-1 bg-surface min-w-0">{children}</main>
      </div>
    </div>
  )
}
