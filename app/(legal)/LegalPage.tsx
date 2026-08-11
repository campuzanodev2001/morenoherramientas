/**
 * Primitivos tipográficos de las páginas legales. Existen para no repetir la
 * misma lista de clases de Tailwind en siete archivos y para que todas las
 * páginas se vean igual.
 */

export function LegalTitle({
  children,
  updatedAt,
}: {
  children: React.ReactNode
  updatedAt?: string
}) {
  return (
    <header className="mb-10 border-b-4 border-accent-red pb-6">
      <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-on-surface">
        {children}
      </h1>
      {updatedAt && (
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-3">
          Última actualización: {updatedAt}
        </p>
      )}
    </header>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-black uppercase tracking-tight text-on-surface mb-3">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm md:text-base leading-relaxed text-on-surface-variant">{children}</p>
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="flex flex-col gap-2 pl-5 list-disc marker:text-accent-red">{children}</ul>
  )
}

export function LI({ children }: { children: React.ReactNode }) {
  return <li className="text-sm md:text-base leading-relaxed text-on-surface-variant">{children}</li>
}

/** Bloque destacado para lo que el comprador no se puede perder. */
export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-accent-red bg-surface-container px-4 py-3">
      <div className="flex flex-col gap-2 text-sm md:text-base leading-relaxed text-on-surface">
        {children}
      </div>
    </div>
  )
}
