import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalTitle, LegalSection, P, UL, LI, Callout } from '../LegalPage'
import { business, resolved, addressLine, CONSUMER_DEFENSE_URL } from '@/lib/store/business'

export const metadata: Metadata = {
  title: 'Términos y condiciones | Moreno Herramientas',
  description:
    'Condiciones de uso y de venta de la tienda online de Moreno Herramientas: precios, stock, pagos, envíos y derecho de arrepentimiento.',
}

export default function TerminosPage() {
  const legalName = resolved(business.legalName)
  const cuit = resolved(business.cuit)
  const address = addressLine()
  const email = resolved(business.email)

  return (
    <>
      <LegalTitle updatedAt="agosto de 2026">Términos y condiciones</LegalTitle>

      <LegalSection title="1. Titular del sitio">
        <P>
          Este sitio es operado por {legalName ?? 'Moreno Herramientas'}
          {cuit ? `, CUIT ${cuit}` : ''}
          {address ? `, con domicilio comercial en ${address}` : ''}. Al navegar el sitio o
          realizar una compra aceptás estos términos en su totalidad.
        </P>
      </LegalSection>

      <LegalSection title="2. Productos, precios y stock">
        <UL>
          <LI>
            Los precios están expresados en <strong>pesos argentinos</strong>, son finales e
            incluyen IVA.
          </LI>
          <LI>
            Los precios y el stock pueden modificarse sin aviso previo. El precio aplicable es el
            vigente al momento de confirmar la compra.
          </LI>
          <LI>
            Las fotos son ilustrativas. Las especificaciones técnicas provienen de los catálogos
            oficiales de cada fabricante; ante una diferencia, prevalece la ficha del fabricante.
          </LI>
          <LI>
            Si detectamos un error evidente de carga en un precio, nos reservamos el derecho de
            anular la operación y reintegrar el importe en su totalidad.
          </LI>
          <LI>
            Si un producto queda sin stock después de confirmada la compra, te contactamos para
            ofrecerte un reemplazo o el reintegro total.
          </LI>
        </UL>
      </LegalSection>

      <LegalSection title="3. Compra y medios de pago">
        <P>
          Podés comprar con cuenta registrada o como invitado. Se aceptan los siguientes medios:
        </P>
        <UL>
          <LI>
            <strong>MercadoPago</strong>: tarjeta de crédito, débito y las cuotas que la
            plataforma ofrezca al momento del pago.
          </LI>
          <LI>
            <strong>Transferencia bancaria</strong>: con un{' '}
            <strong>10% de descuento</strong> sobre el subtotal. La orden queda pendiente hasta
            que verifiquemos la acreditación.
          </LI>
        </UL>
        <P>
          Las órdenes pendientes de pago se cancelan automáticamente si no se acredita el pago en
          el plazo informado al momento de la compra, liberando el stock reservado.
        </P>
      </LegalSection>

      <LegalSection title="4. Envíos">
        <P>
          Realizamos envíos a todo el país con Andreani y Correo Argentino. El costo se calcula
          por código postal durante el checkout y los plazos son los que informa cada correo;
          no son plazos garantizados por nosotros. Más detalle en{' '}
          <Link href="/envios" className="text-accent-red font-bold underline">
            Envíos y entregas
          </Link>
          .
        </P>
      </LegalSection>

      <LegalSection title="5. Derecho de arrepentimiento">
        <Callout>
          <p>
            Si comprás a distancia, tenés <strong>10 días corridos</strong> desde que recibís el
            producto para arrepentirte, sin dar motivo y sin ningún costo, según el artículo 34
            de la Ley 24.240. El costo de la devolución corre por nuestra cuenta.
          </p>
          <p>
            <Link href="/arrepentimiento" className="text-accent-red font-bold underline">
              Ejercé tu derecho de arrepentimiento acá →
            </Link>
          </p>
        </Callout>
        <P>
          El producto debe devolverse en el mismo estado en que se recibió, sin uso y con su
          embalaje original.
        </P>
      </LegalSection>

      <LegalSection title="6. Garantía">
        <P>
          Todos los productos cuentan con la garantía legal prevista en los artículos 11 a 18 de
          la Ley 24.240 y, cuando corresponda, con la garantía del fabricante. La garantía no
          cubre el desgaste normal por uso, ni los daños por uso indebido, sobrecarga, golpes o
          reparaciones hechas por terceros no autorizados. Ver{' '}
          <Link href="/devoluciones" className="text-accent-red font-bold underline">
            Cambios y devoluciones
          </Link>
          .
        </P>
      </LegalSection>

      <LegalSection title="7. Cuenta de usuario">
        <P>
          Sos responsable de la confidencialidad de tu contraseña y de la actividad de tu cuenta.
          Podemos suspender cuentas ante uso fraudulento o incumplimiento de estos términos.
        </P>
      </LegalSection>

      <LegalSection title="8. Propiedad intelectual">
        <P>
          Los contenidos del sitio (textos, diseño, logos) son propiedad de sus respectivos
          titulares y no pueden reproducirse sin autorización. Las marcas de los productos
          pertenecen a sus fabricantes.
        </P>
      </LegalSection>

      <LegalSection title="9. Defensa del consumidor">
        <P>
          Ante cualquier reclamo podés contactarnos {email ? `a ${email}` : 'por los canales publicados en el sitio'}{' '}
          o acudir a la ventanilla oficial de{' '}
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

      <LegalSection title="10. Ley aplicable y jurisdicción">
        <P>
          Estos términos se rigen por las leyes de la República Argentina. Para cualquier
          controversia se aplican los tribunales competentes del domicilio del consumidor, según
          lo previsto en la normativa de defensa del consumidor.
        </P>
      </LegalSection>
    </>
  )
}
