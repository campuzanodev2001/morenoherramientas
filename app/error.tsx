'use client'

import Link from 'next/link'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="material-symbols-outlined text-[72px] text-accent-red" style={{ fontVariationSettings: "'FILL' 1" }}>
        report
      </span>
      <h1 className="text-2xl font-black uppercase text-on-surface">Algo salió mal</h1>
      <p className="text-on-surface-variant font-medium">Ocurrió un error inesperado. Probá de nuevo.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-8 text-sm">
          Reintentar
        </button>
        <Link href="/" className="border-2 border-primary-container text-primary-container font-black uppercase tracking-widest py-3 px-8 text-sm">
          Inicio
        </Link>
      </div>
    </main>
  )
}
