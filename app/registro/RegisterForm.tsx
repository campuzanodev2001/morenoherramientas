'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { registerSchema } from '@/lib/validations/auth'
import { registerUser } from '@/lib/auth/actions'

type Fields = 'name' | 'email' | 'password' | 'confirmPassword'

export default function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Fields, string>>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function setField(field: Fields, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function validateAll(): boolean {
    const parsed = registerSchema.safeParse(values)
    if (parsed.success) {
      setFieldErrors({})
      return true
    }
    const errs: Partial<Record<Fields, string>> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as Fields
      if (!errs[key]) errs[key] = issue.message
    }
    setFieldErrors(errs)
    return false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!validateAll()) return

    setSubmitting(true)
    const result = await registerUser(values)
    if (!result.success) {
      setSubmitting(false)
      if (result.fields) {
        const errs: Partial<Record<Fields, string>> = {}
        for (const f of result.fields) errs[f.field as Fields] = f.message
        setFieldErrors(errs)
      } else {
        setFormError(result.error)
      }
      return
    }

    // Auto-login tras el registro.
    const res = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })
    setSubmitting(false)
    if (!res || res.error) {
      router.push('/login')
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  const fields: { key: Fields; label: string; type: string; autoComplete: string }[] = [
    { key: 'name', label: 'Nombre', type: 'text', autoComplete: 'name' },
    { key: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
    { key: 'password', label: 'Contraseña', type: 'password', autoComplete: 'new-password' },
    { key: 'confirmPassword', label: 'Repetir contraseña', type: 'password', autoComplete: 'new-password' },
  ]

  return (
    <div className="min-h-screen bg-primary-container flex items-center justify-center px-4 py-10">
      <div className="bg-surface-container-lowest w-full max-w-sm p-8">
        <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight mb-1">Crear cuenta</h1>
        <p className="text-on-surface-variant text-sm font-medium mb-6">Moreno Herramientas</p>

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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label htmlFor={f.key} className="text-xs font-black uppercase text-on-surface tracking-wider">
                {f.label}
              </label>
              <input
                id={f.key}
                type={f.type}
                value={values[f.key]}
                onChange={(e) => setField(f.key, e.target.value)}
                onBlur={validateAll}
                className="border-2 border-primary-container bg-surface-container-lowest px-3 py-2 text-on-surface"
                autoComplete={f.autoComplete}
              />
              {fieldErrors[f.key] && (
                <span className="text-xs text-red-600 font-medium">{fieldErrors[f.key]}</span>
              )}
            </div>
          ))}

          {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-primary-container text-on-primary-container font-black uppercase py-2.5 disabled:opacity-50"
          >
            {submitting ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-sm text-on-surface-variant mt-6 text-center">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-on-surface font-bold underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  )
}
