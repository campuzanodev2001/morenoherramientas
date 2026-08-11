import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalTitle, LegalSection, P, UL, LI, Callout } from '../LegalPage'
import { business, resolved, whatsappUrl, CANCELLATION_WINDOW_DAYS } from '@/lib/store/business'

export const metadata: Metadata = {
  title: 'Cambios y devoluciones | Moreno Herramientas',
  description:
    'Cómo cambiar o devolver un producto, plazos, garantía legal y derecho de arrepentimiento.',
}

export default function DevolucionesPage() {
  const email = resolved(business.email)
  const wa = whatsappUrl('Hola, necesito gestionar un cambio o devolución.')

  return (
    <>
      <LegalTitle updatedAt="agosto de 2026">Cambios y devoluciones</LegalTitle>

      <LegalSection title="Arrepentimiento: 10 días, sin dar motivo">
        <Callout>
          <p>
            Tenés <strong>{CANCELLATION_WINDOW_DAYS} días corridos</strong> desde que recibís el
            producto para arrepentirte de la compra. No hace falta justificar nada y el costo de
            la devolución lo pagamos nosotros (Ley 24.240, art. 34).
          </p>
          <p>
            <Link href="/arrepentimiento" className="text-accent-red font-bold underline">
              Completá el formulario de arrepentimiento →
            </Link>
          </p>
        </Callout>
        <P>
          Una vez recibido el pedido de arrepentimiento, coordinamos el retiro y te reintegramos
          el importe total por el mismo medio de pago que usaste.
        </P>
      </LegalSection>

      <LegalSection title="Producto fallado o distinto al comprado">
        <P>
          Si el producto llegó dañado, falla o no es el que pediste, escribinos dentro de las 48
          horas de recibido con el número de orden y fotos. Nos hacemos cargo del retiro y lo
          cambiamos o te reintegramos el importe, a tu elección.
        </P>
      </LegalSection>

      <LegalSection title="Garantía">
        <P>
          Todos los productos tienen la garantía legal de los artículos 11 a 18 de la Ley 24.240
          y, cuando corresponda, la garantía del fabricante. Para hacerla valer necesitás el
          número de orden o la factura.
        </P>
        <P>La garantía no cubre:</P>
        <UL>
          <LI>Desgaste normal por uso.</LI>
          <LI>Daños por uso indebido, sobrecarga, golpes o caídas.</LI>
          <LI>Herramientas abiertas, modificadas o reparadas por terceros no autorizados.</LI>
          <LI>Consumibles y elementos de desgaste (mechas, discos, electrodos).</LI>
        </UL>
      </LegalSection>

      <LegalSection title="Condiciones para la devolución">
        <UL>
          <LI>El producto tiene que estar sin uso y en el mismo estado en que se entregó.</LI>
          <LI>Con su embalaje original, accesorios y manuales completos.</LI>
          <LI>Con el número de orden a mano.</LI>
        </UL>
      </LegalSection>

      <LegalSection title="Cómo gestionar el reintegro">
        <UL>
          <LI>
            <strong>Pagaste con MercadoPago</strong>: el reintegro se hace por la misma vía y los
            plazos de acreditación dependen de tu banco o emisor de la tarjeta.
          </LI>
          <LI>
            <strong>Pagaste por transferencia</strong>: te devolvemos el importe por
            transferencia a la misma cuenta desde la que pagaste.
          </LI>
        </UL>
      </LegalSection>

      <LegalSection title="Contactanos">
        <P>
          Para cualquiera de estos casos escribinos
          {email ? (
            <>
              {' '}
              a{' '}
              <a href={`mailto:${email}`} className="text-accent-red font-bold underline">
                {email}
              </a>
            </>
          ) : null}
          {wa ? (
            <>
              {' '}
              o por{' '}
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-red font-bold underline"
              >
                WhatsApp
              </a>
            </>
          ) : null}
          . También podés escribirnos desde la página de{' '}
          <Link href="/contacto" className="text-accent-red font-bold underline">
            Contacto
          </Link>
          .
        </P>
      </LegalSection>
    </>
  )
}
