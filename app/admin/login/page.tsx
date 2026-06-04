'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_SESSION_KEY = 'admin_session'
const ADMIN_PASSWORD = 'moreno2024'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(false)
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
      router.replace('/admin')
    } else {
      setError(true)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-container flex items-center justify-center px-4">
      <div className="bg-surface-container-lowest w-full max-w-sm p-8">
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight mb-1">
          Panel Admin
        </h1>
        <p className="text-on-surface-variant text-sm font-medium mb-6">
          Moreno Herramientas
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase text-on-surface tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-2 border-outline px-3 py-3 text-sm font-medium text-on-surface bg-surface focus:outline-none focus:border-primary-container w-full"
              placeholder="••••••••"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-accent-red text-xs font-bold uppercase">
              Contraseña incorrecta
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !password}
            className="bg-primary-container text-on-primary font-black text-sm py-3 uppercase tracking-widest hover:bg-primary transition-colors duration-150 disabled:opacity-50"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}
