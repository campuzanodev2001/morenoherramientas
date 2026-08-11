import StoreHeader from '@/app/components/StoreHeader'
import StoreFooter from '@/app/components/StoreFooter'

/**
 * Shell de las páginas institucionales y legales. Todas comparten header,
 * footer y el mismo ancho de lectura; el contenido lo pone cada página con
 * los helpers de `LegalPage`.
 *
 * El grupo `(legal)` no agrega segmento a la URL: las rutas quedan
 * /terminos, /privacidad, etc.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main className="pt-16 flex-1">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-16">{children}</div>
      </main>
      <StoreFooter />
    </>
  )
}
