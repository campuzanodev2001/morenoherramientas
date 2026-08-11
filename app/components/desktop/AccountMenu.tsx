'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

/**
 * Menú de cuenta del navbar de desktop. Cambia según la sesión: si el usuario
 * está logueado muestra sus accesos, y si no, ingresar y crear cuenta. Así se
 * evita el rebote de mandarlo a /cuenta para que el middleware lo devuelva al
 * login.
 *
 * Abre con click (no con hover, a diferencia del de categorías): acá hay una
 * acción destructiva —cerrar sesión— y abrir por accidente al pasar el mouse
 * la deja a un click de distancia.
 */

const LOGGED_LINKS = [
  { href: '/cuenta', label: 'Mi cuenta', icon: 'person' },
  { href: '/cuenta/ordenes', label: 'Mis pedidos', icon: 'receipt_long' },
  { href: '/cuenta/perfil', label: 'Mis datos', icon: 'badge' },
] as const

export default function AccountMenu() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al navegar. Se ajusta durante el render comparando con el pathname
  // anterior, en vez de con un efecto: es el patrón que recomienda React para
  // resetear estado cuando cambia una prop, y evita el render en cascada.
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  // Click afuera: el listener se registra solo mientras el menú está abierto.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const user = session?.user
  const isAdmin = user?.role === 'admin'
  const firstName = user?.name?.split(' ')[0] ?? null

  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          setOpen(false)
          ref.current?.querySelector('button')?.focus()
        }
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 p-2 transition-colors ${
          open ? 'text-accent-red' : 'text-primary-container hover:text-accent-red'
        }`}
        aria-label={user ? `Cuenta de ${user.name ?? user.email}` : 'Ingresar a tu cuenta'}
      >
        <span className="material-symbols-outlined">person</span>
        {/* Mientras carga la sesión no se muestra nada: un "Ingresar" que
            cambia a un nombre medio segundo después es peor que un hueco. */}
        {status !== 'loading' && (
          <span className="text-xs font-black uppercase tracking-wide max-w-[90px] truncate">
            {firstName ?? 'Ingresar'}
          </span>
        )}
        <span
          className={`material-symbols-outlined text-lg transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-16 z-50 w-60 bg-surface-container-lowest border-2 border-charcoal shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
          {user ? (
            <>
              <div className="px-4 py-3 bg-surface-container border-b-2 border-charcoal">
                <p className="text-xs font-black uppercase tracking-wide text-on-surface truncate">
                  {user.name ?? 'Mi cuenta'}
                </p>
                {user.email && (
                  <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                )}
              </div>

              {LOGGED_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors border-b border-outline-variant"
                >
                  <span className="material-symbols-outlined text-lg text-outline">{l.icon}</span>
                  {l.label}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-primary-container hover:bg-surface-container transition-colors border-b border-outline-variant"
                >
                  <span className="material-symbols-outlined text-lg">shield_person</span>
                  Panel admin
                </Link>
              )}

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-accent-red font-bold hover:bg-surface-container transition-colors text-left"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-black uppercase tracking-wide text-on-primary bg-accent-red hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors border-t-2 border-charcoal"
              >
                <span className="material-symbols-outlined text-lg text-outline">person_add</span>
                Crear cuenta
              </Link>
              <Link
                href="/cuenta/ordenes"
                className="flex items-center gap-3 px-4 py-3 text-xs text-on-surface-variant hover:bg-surface-container transition-colors border-t border-outline-variant"
              >
                <span className="material-symbols-outlined text-base text-outline">
                  local_shipping
                </span>
                Seguir un pedido
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
