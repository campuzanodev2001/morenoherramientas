import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalTitle, LegalSection, P } from '../LegalPage'
import {
  business,
  socials,
  resolved,
  whatsappUrl,
  addressLine,
  CONSUMER_DEFENSE_URL,
} from '@/lib/store/business'

export const metadata: Metadata = {
  title: 'Contacto | Moreno Herramientas',
  description:
    'Escribinos por WhatsApp, mail o teléfono. Asesoramiento técnico para elegir la herramienta correcta.',
}

function Card({
  icon,
  title,
  children,
}: {
  icon: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-2 border-charcoal bg-surface-container-lowest p-5 flex gap-4">
      <span className="material-symbols-outlined text-3xl text-accent-red shrink-0">{icon}</span>
      <div className="flex flex-col gap-1 min-w-0">
        <h2 className="text-sm font-black uppercase tracking-wide text-on-surface">{title}</h2>
        <div className="text-sm text-on-surface-variant break-words">{children}</div>
      </div>
    </div>
  )
}

export default function ContactoPage() {
  const wa = whatsappUrl('Hola, necesito asesoramiento sobre una herramienta.')
  const email = resolved(business.email)
  const phone = resolved(business.phone)
  const address = addressLine()
  const hours = resolved(business.hours)
  const activeSocials = socials.filter((s) => resolved(s.url) !== null)

  const hasAnyChannel = wa || email || phone || address

  return (
    <>
      <LegalTitle>Contacto</LegalTitle>

      <P>
        ¿Dudas sobre qué herramienta necesitás para un trabajo puntual? Escribinos y te
        asesoramos. Conocemos el catálogo y podemos decirte si una llave entra donde la necesitás.
      </P>

      <div className="grid gap-4 sm:grid-cols-2 my-8">
        {wa && (
          <Card icon="chat" title="WhatsApp">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="text-accent-red font-bold underline">
              Escribinos ahora
            </a>
          </Card>
        )}
        {email && (
          <Card icon="mail" title="Email">
            <a href={`mailto:${email}`} className="text-accent-red font-bold underline">
              {email}
            </a>
          </Card>
        )}
        {phone && (
          <Card icon="call" title="Teléfono">
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-accent-red font-bold underline">
              {phone}
            </a>
          </Card>
        )}
        {address && (
          <Card icon="storefront" title="Dónde estamos">
            {address}
          </Card>
        )}
        {hours && (
          <Card icon="schedule" title="Horario de atención">
            {hours}
          </Card>
        )}
        {activeSocials.length > 0 && (
          <Card icon="share" title="Redes">
            <div className="flex gap-3">
              {activeSocials.map((s) => (
                <a
                  key={s.key}
                  href={resolved(s.url) ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-red font-bold underline"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </Card>
        )}
      </div>

      {!hasAnyChannel && (
        <div className="border-2 border-accent-red bg-surface-container p-5 my-8">
          <p className="text-sm font-bold text-on-surface">
            Los canales de contacto todavía no están publicados.
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
            Cargalos en <code className="font-mono text-xs">lib/store/business.ts</code> para que
            aparezcan acá y en el footer.
          </p>
        </div>
      )}

      <LegalSection title="Sobre un pedido en curso">
        <P>
          Si tu consulta es por una compra ya hecha, tené a mano el número de orden. Podés verlo
          en{' '}
          <Link href="/cuenta/ordenes" className="text-accent-red font-bold underline">
            Mis pedidos
          </Link>{' '}
          o en el mail de confirmación.
        </P>
        <P>
          Para cancelar una compra dentro de los 10 días de recibida, usá el{' '}
          <Link href="/arrepentimiento" className="text-accent-red font-bold underline">
            botón de arrepentimiento
          </Link>
          .
        </P>
      </LegalSection>

      <LegalSection title="Reclamos">
        <P>
          Si no pudimos resolver tu reclamo, podés presentarlo ante{' '}
          <a
            href={CONSUMER_DEFENSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-red font-bold underline"
          >
            Defensa de las y los Consumidores
          </a>
          .
        </P>
      </LegalSection>
    </>
  )
}
