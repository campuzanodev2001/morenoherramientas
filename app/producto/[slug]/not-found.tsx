import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center gap-5 px-4 text-center pt-16">
      <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40">search_off</span>
      <h1 className="text-2xl font-black uppercase text-on-surface">Producto no encontrado</h1>
      <p className="text-on-surface-variant font-medium">El producto que buscás no existe o ya no está disponible.</p>
      <Link href="/" className="border-2 border-primary-container text-primary-container font-black uppercase tracking-widest py-3 px-8 text-sm hover:bg-primary-container hover:text-on-primary transition-colors">
        Volver al inicio
      </Link>
    </main>
  )
}
