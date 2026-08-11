import type { Metadata } from 'next'
import { LegalTitle, LegalSection, P, UL, LI } from '../LegalPage'
import { business, resolved } from '@/lib/store/business'

export const metadata: Metadata = {
  title: 'Política de privacidad | Moreno Herramientas',
  description:
    'Qué datos personales recolectamos, para qué los usamos, con quién los compartimos y cómo ejercer tus derechos (Ley 25.326).',
}

export default function PrivacidadPage() {
  const legalName = resolved(business.legalName)
  const email = resolved(business.email)

  return (
    <>
      <LegalTitle updatedAt="agosto de 2026">Política de privacidad</LegalTitle>

      <LegalSection title="1. Responsable de la base de datos">
        <P>
          {legalName ?? 'Moreno Herramientas'} es responsable del tratamiento de los datos
          personales que se recolectan en este sitio, conforme a la Ley 25.326 de Protección de
          los Datos Personales.
        </P>
      </LegalSection>

      <LegalSection title="2. Qué datos recolectamos">
        <UL>
          <LI>
            <strong>Datos de contacto y facturación</strong>: nombre, email, teléfono y domicilio
            de entrega. Los necesitamos para procesar y enviar tu pedido.
          </LI>
          <LI>
            <strong>Datos de la cuenta</strong>: email y contraseña (guardada siempre en forma
            cifrada, nunca en texto plano), o los datos básicos de tu perfil de Google si elegís
            ingresar con esa opción.
          </LI>
          <LI>
            <strong>Historial de compras</strong>: los pedidos que hiciste y su estado.
          </LI>
          <LI>
            <strong>Datos técnicos</strong>: dirección IP y registros de actividad, usados para
            seguridad, prevención de fraude y diagnóstico de errores.
          </LI>
        </UL>
        <P>
          <strong>No almacenamos los datos de tu tarjeta.</strong> Los pagos con tarjeta los
          procesa íntegramente MercadoPago en su propio entorno; nosotros solo recibimos el
          resultado de la operación.
        </P>
      </LegalSection>

      <LegalSection title="3. Para qué los usamos">
        <UL>
          <LI>Procesar tu compra, cobrarla y despachar el envío.</LI>
          <LI>Enviarte mails transaccionales: confirmación, despacho y entrega del pedido.</LI>
          <LI>Atender tus consultas y reclamos.</LI>
          <LI>Cumplir obligaciones fiscales, contables y legales.</LI>
          <LI>Detectar y prevenir fraude.</LI>
        </UL>
      </LegalSection>

      <LegalSection title="4. Con quién los compartimos">
        <P>
          Solo con los proveedores necesarios para que el servicio funcione, y únicamente con los
          datos que cada uno precisa:
        </P>
        <UL>
          <LI>
            <strong>MercadoPago</strong> — procesamiento de pagos.
          </LI>
          <LI>
            <strong>Andreani y Correo Argentino</strong> — cotización y despacho de envíos.
          </LI>
          <LI>
            <strong>Resend</strong> — envío de mails transaccionales.
          </LI>
          <LI>
            <strong>Supabase, Vercel, Cloudinary y Upstash</strong> — infraestructura de base de
            datos, hosting, imágenes y control de tráfico.
          </LI>
          <LI>
            <strong>Sentry y Axiom</strong> — monitoreo de errores y registro de actividad.
          </LI>
        </UL>
        <P>No vendemos, alquilamos ni cedemos tus datos personales a terceros con fines comerciales.</P>
      </LegalSection>

      <LegalSection title="5. Cookies">
        <P>
          Usamos cookies propias, necesarias para el funcionamiento del sitio: mantener tu sesión
          iniciada y conservar el contenido del carrito. No usamos cookies de publicidad ni de
          perfilado. Podés bloquearlas desde tu navegador, pero en ese caso no vas a poder
          iniciar sesión ni completar una compra.
        </P>
      </LegalSection>

      <LegalSection title="6. Cuánto tiempo los conservamos">
        <P>
          Los datos de las operaciones se conservan por el plazo que exige la normativa fiscal y
          comercial. Los datos de tu cuenta, mientras la mantengas activa.
        </P>
      </LegalSection>

      <LegalSection title="7. Tus derechos">
        <P>
          Podés acceder, rectificar, actualizar y suprimir tus datos personales en cualquier
          momento{email ? ` escribiéndonos a ${email}` : ' escribiéndonos por los canales publicados en el sitio'}.
          El titular de los datos tiene derecho a solicitar el retiro o bloqueo de su nombre de
          nuestra base de datos.
        </P>
        <P>
          Conforme al artículo 14, inciso 3 de la Ley 25.326, el titular podrá ejercer el derecho
          de acceso en forma gratuita a intervalos no inferiores a seis meses, salvo que acredite
          un interés legítimo al efecto.
        </P>
        <P>
          La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326,
          tiene la atribución de atender las denuncias y reclamos que interpongan quienes
          resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia
          de protección de datos personales.
        </P>
      </LegalSection>

      <LegalSection title="8. Seguridad">
        <P>
          Aplicamos medidas técnicas y organizativas para proteger tus datos: cifrado en
          tránsito, contraseñas hasheadas, control de acceso por roles y límites de tasa contra
          abusos. Ningún sistema es infalible, pero trabajamos para minimizar el riesgo.
        </P>
      </LegalSection>
    </>
  )
}
