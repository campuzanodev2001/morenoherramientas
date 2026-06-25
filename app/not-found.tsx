import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="material-symbols-outlined text-[72px] text-accent-red" style={{ fontVariationSettings: "'FILL' 1" }}>
        error
      </span>
      <h1 className="text-3xl font-black uppercase text-on-surface">Página no encontrada</h1>
      <p className="text-on-surface-variant font-medium">No pudimos encontrar lo que buscabas.</p>
      <Link href="/" className="bg-accent-red text-on-primary font-black uppercase tracking-widest py-3 px-8 text-sm">
        Volver al inicio
      </Link>
    </main>
  )
}
