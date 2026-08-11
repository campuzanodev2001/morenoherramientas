import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalTitle, LegalSection, P, Callout } from '../LegalPage'

export const metadata: Metadata = {
  title: 'Cómo comprar | Moreno Herramientas',
  description:
    'Paso a paso para comprar en Moreno Herramientas: buscar el producto, elegir el envío y pagar con MercadoPago o transferencia con 10% de descuento.',
}

const steps = [
  {
    icon: 'search',
    title: '1. Encontrá tu herramienta',
    body: 'Buscá por nombre, marca o código desde el buscador, o navegá por categorías. En la ficha de cada producto vas a ver el stock disponible y las especificaciones técnicas.',
  },
  {
    icon: 'add_shopping_cart',
    title: '2. Agregala al carrito',
    body: 'Podés seguir comprando y revisar el carrito cuando quieras. No hace falta tener cuenta para armarlo.',
  },
  {
    icon: 'local_shipping',
    title: '3. Ingresá tus datos y el código postal',
    body: 'Con el código postal calculamos el costo de envío y te mostramos las opciones de Andreani y Correo Argentino. Podés comprar como invitado o con tu cuenta.',
  },
  {
    icon: 'payments',
    title: '4. Elegí cómo pagar',
    body: 'Con MercadoPago (tarjeta de crédito, débito y cuotas) o por transferencia bancaria con 10% de descuento.',
  },
  {
    icon: 'mark_email_read',
    title: '5. Listo',
    body: 'Te llega un mail con la confirmación del pedido y, al despacharlo, otro con el número de seguimiento.',
  },
]

export default function ComoComprarPage() {
  return (
    <>
      <LegalTitle>Cómo comprar</LegalTitle>

      <div className="flex flex-col gap-5 mb-10">
        {steps.map((s) => (
          <div key={s.icon} className="flex gap-4 border-2 border-charcoal bg-surface-container-lowest p-5">
            <span className="material-symbols-outlined text-3xl text-accent-red shrink-0">
              {s.icon}
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-black uppercase tracking-tight text-on-surface">
                {s.title}
              </h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <LegalSection title="Pagando por transferencia ahorrás un 10%">
        <Callout>
          <p>
            Al elegir <strong>transferencia bancaria</strong> se descuenta automáticamente un{' '}
            <strong>10% del subtotal</strong>. Después de confirmar el pedido te mostramos los
            datos de la cuenta y el importe exacto a transferir.
          </p>
          <p>
            El pedido queda reservado hasta que verifiquemos la acreditación. Si no llega en el
            plazo informado, se cancela solo y el stock se libera.
          </p>
        </Callout>
      </LegalSection>

      <LegalSection title="¿Necesitás factura A?">
        <P>
          Indicanos tu CUIT y razón social al momento de la compra o escribinos desde{' '}
          <Link href="/contacto" className="text-accent-red font-bold underline">
            Contacto
          </Link>{' '}
          con el número de pedido.
        </P>
      </LegalSection>

      <LegalSection title="¿Comprás para tu taller?">
        <P>
          Si necesitás cantidad o un producto que no ves publicado, escribinos: trabajamos con
          más de 80 marcas y podemos cotizarte por pedido.
        </P>
      </LegalSection>
    </>
  )
}
