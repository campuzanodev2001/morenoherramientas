'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { loginSchema } from '@/lib/validations/auth'

interface LoginFormProps {
  callbackUrl: string
  /** Google OAuth configurado en el servidor. Si es false no se muestra el botón. */
  googleEnabled: boolean
}

export default function LoginForm({ callbackUrl, googleEnabled }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validateField(field: 'email' | 'password', value: string) {
    const result = loginSchema.shape[field].safeParse(value)
    setFieldErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const errs: { email?: string; password?: string } = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'email' || key === 'password') errs[key] = issue.message
      }
      setFieldErrors(errs)
      return
    }

    setSubmitting(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setSubmitting(false)

    if (!res || res.error) {
      setFormError('Email o contraseña incorrectos.')
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-primary-container flex items-center justify-center px-4">
      <div className="bg-surface-container-lowest w-full max-w-sm p-8">
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight mb-1">Ingresar</h1>
        <p className="text-on-surface-variant text-sm font-medium mb-6">Moreno Herramientas</p>

        {googleEnabled && (
          <>
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full border-2 border-primary-container text-on-surface font-bold py-2.5 mb-5 hover:bg-primary-container/10"
            >
              Continuar con Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="h-px flex-1 bg-primary-container/40" />
              <span className="text-xs text-on-surface-variant uppercase">o con email</span>
              <span className="h-px flex-1 bg-primary-container/40" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-black uppercase text-on-surface tracking-wider">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => validateField('email', e.target.value)}
              className="border-2 border-primary-container bg-surface-container-lowest px-3 py-2 text-on-surface"
              autoComplete="email"
            />
            {fieldErrors.email && <span className="text-xs text-red-600 font-medium">{fieldErrors.email}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-black uppercase text-on-surface tracking-wider">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={(e) => validateField('password', e.target.value)}
              className="border-2 border-primary-container bg-surface-container-lowest px-3 py-2 text-on-surface"
              autoComplete="current-password"
            />
            {fieldErrors.password && <span className="text-xs text-red-600 font-medium">{fieldErrors.password}</span>}
          </div>

          {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-primary-container text-on-primary-container font-black uppercase py-2.5 disabled:opacity-50"
          >
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="text-sm text-on-surface-variant mt-6 text-center">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="text-on-surface font-bold underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
