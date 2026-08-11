import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalTitle, LegalSection, P, UL, LI } from '../LegalPage'

export const metadata: Metadata = {
  title: 'Envíos y entregas | Moreno Herramientas',
  description:
    'Envíos a todo el país con Andreani y Correo Argentino. Cómo se calcula el costo, plazos y seguimiento del pedido.',
}

export default function EnviosPage() {
  return (
    <>
      <LegalTitle>Envíos y entregas</LegalTitle>

      <LegalSection title="A dónde enviamos">
        <P>
          Hacemos envíos a todo el territorio de la República Argentina con{' '}
          <strong>Andreani</strong> y <strong>Correo Argentino</strong>.
        </P>
      </LegalSection>

      <LegalSection title="Cuánto cuesta">
        <P>
          El costo del envío se calcula en el checkout a partir de tu código postal y del peso y
          volumen del pedido. Vas a ver el precio exacto antes de pagar, junto con las opciones
          de cada correo para que elijas la que más te convenga.
        </P>
      </LegalSection>

      <LegalSection title="Plazos">
        <UL>
          <LI>Preparamos y despachamos el pedido dentro de las 24 a 72 horas hábiles de acreditado el pago.</LI>
          <LI>
            El tiempo de tránsito depende del correo y del destino. Los plazos que se muestran en
            el checkout son los que informa cada transportista y son estimados: no dependen de
            nosotros.
          </LI>
          <LI>
            Los pagos por transferencia se despachan una vez verificada la acreditación, lo que
            puede sumar un día hábil.
          </LI>
        </UL>
      </LegalSection>

      <LegalSection title="Seguimiento">
        <P>
          Cuando despachamos el pedido te mandamos un mail con el número de seguimiento. También
          podés ver el estado de todas tus compras en{' '}
          <Link href="/cuenta/ordenes" className="text-accent-red font-bold underline">
            Mis pedidos
          </Link>
          . Si compraste como invitado, el link de seguimiento va en el mail de confirmación.
        </P>
      </LegalSection>

      <LegalSection title="Si no estás cuando llega">
        <P>
          Cada correo tiene su propia política de reintentos de entrega y de guarda en sucursal.
          Si el paquete vuelve a origen por domicilio incorrecto o por ausencias reiteradas, el
          costo del reenvío corre por cuenta del comprador.
        </P>
      </LegalSection>

      <LegalSection title="Revisá el paquete al recibirlo">
        <P>
          Si el embalaje llega visiblemente dañado, dejalo asentado con el transportista y
          avisanos dentro de las 48 horas. Con eso podemos reclamarle al correo y resolverte el
          caso mucho más rápido. Ver{' '}
          <Link href="/devoluciones" className="text-accent-red font-bold underline">
            Cambios y devoluciones
          </Link>
          .
        </P>
      </LegalSection>
    </>
  )
}
