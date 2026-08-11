import type { Metadata } from 'next'
import Link from 'next/link'
import CancellationForm from './CancellationForm'
import { LegalTitle, LegalSection, P, UL, LI, Callout } from '../LegalPage'
import { CANCELLATION_WINDOW_DAYS, CONSUMER_DEFENSE_URL } from '@/lib/store/business'

export const metadata: Metadata = {
  title: 'Botón de arrepentimiento | Moreno Herramientas',
  description:
    'Cancelá tu compra dentro de los 10 días corridos de recibida, sin costo y sin dar motivo (Ley 24.240, art. 34 — Res. 424/2020).',
}

export default function ArrepentimientoPage() {
  return (
    <>
      <LegalTitle>Botón de arrepentimiento</LegalTitle>

      <Callout>
        <p>
          Si compraste a distancia, tenés <strong>{CANCELLATION_WINDOW_DAYS} días corridos</strong>{' '}
          desde que recibís el producto para arrepentirte de la compra,{' '}
          <strong>sin dar ningún motivo y sin costo alguno</strong>. Es tu derecho según el
          artículo 34 de la Ley 24.240 de Defensa del Consumidor y la Resolución 424/2020.
        </p>
        <p>El costo de la devolución corre por nuestra cuenta.</p>
      </Callout>

      <div className="my-8">
        <CancellationForm />
      </div>

      <LegalSection title="Qué pasa después">
        <UL>
          <LI>Te llega un mail de constancia con tu pedido registrado.</LI>
          <LI>Te contactamos dentro de las 48 horas hábiles para coordinar el retiro.</LI>
          <LI>El producto tiene que estar sin uso y con su embalaje original.</LI>
          <LI>
            Una vez retirado, te reintegramos el importe total por el mismo medio con el que
            pagaste.
          </LI>
        </UL>
      </LegalSection>

      <LegalSection title="Si el producto llegó fallado">
        <P>
          Ese caso no es arrepentimiento sino garantía, y no tiene el límite de{' '}
          {CANCELLATION_WINDOW_DAYS} días. Mirá{' '}
          <Link href="/devoluciones" className="text-accent-red font-bold underline">
            Cambios y devoluciones
          </Link>{' '}
          o escribinos desde{' '}
          <Link href="/contacto" className="text-accent-red font-bold underline">
            Contacto
          </Link>
          .
        </P>
      </LegalSection>

      <LegalSection title="¿Tuviste algún problema para ejercer este derecho?">
        <P>
          Podés reclamar ante{' '}
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
