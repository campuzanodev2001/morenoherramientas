/**
 * Datos del negocio en un solo lugar: los usan el footer, las páginas legales,
 * los mails y el structured data.
 *
 * 🔴 Los valores marcados con el prefijo PENDIENTE son PLACEHOLDERS. Hay que
 * pedírselos al cliente antes de salir a producción — varios son obligatorios
 * por ley (CUIT, razón social y domicilio tienen que estar publicados).
 *
 * Para saber qué falta sin leer el archivo:
 *   npx tsx scripts/check-business-data.ts
 */

const PENDING_PREFIX = 'PENDIENTE:'

/** Marca un dato como no provisto todavía. Se renderiza como vacío, no como texto roto. */
function pending(what: string): string {
  return `${PENDING_PREFIX} ${what}`
}

/** True si el valor sigue siendo un placeholder sin completar. */
export function isPending(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PENDING_PREFIX)
}

/** Devuelve el valor solo si ya fue completado; si no, null. */
export function resolved(value: string | null | undefined): string | null {
  if (!value || isPending(value)) return null
  return value
}

export const business = {
  name: 'Moreno Herramientas',
  /** Razón social inscripta — obligatoria en la web (Ley 24.240, art. 4). */
  legalName: pending('razón social inscripta'),
  cuit: pending('CUIT del titular'),
  /** Domicilio comercial. Obligatorio publicarlo. */
  address: {
    street: pending('calle y número del local'),
    city: pending('localidad'),
    province: pending('provincia'),
    postalCode: pending('código postal'),
    country: 'Argentina',
  },
  /** Horario de atención, en texto libre. */
  hours: pending('horario de atención'),
  /** Solo dígitos con código de país, sin +, espacios ni guiones (formato wa.me). */
  whatsapp: pending('número de WhatsApp'),
  phone: pending('teléfono fijo'),
  email: pending('email de contacto'),
  /** Data Fiscal de ARCA (ex AFIP): URL del formulario 960/D. Obligatorio en e-commerce. */
  dataFiscalUrl: pending('URL del Data Fiscal de ARCA'),
} as const

export const socials = [
  { key: 'instagram', label: 'Instagram', icon: 'photo_camera', url: pending('URL de Instagram') },
  { key: 'facebook', label: 'Facebook', icon: 'thumb_up', url: pending('URL de Facebook') },
] as const

/** Link de WhatsApp listo para usar, o null si el número todavía no está cargado. */
export function whatsappUrl(message?: string): string | null {
  const number = resolved(business.whatsapp)
  if (!number) return null
  const query = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${number}${query}`
}

/** Domicilio en una línea, con solo las partes ya cargadas. */
export function addressLine(): string | null {
  const { street, city, province, postalCode } = business.address
  const parts = [resolved(street), resolved(city), resolved(province), resolved(postalCode)]
  const filled = parts.filter((p): p is string => p !== null)
  return filled.length > 0 ? filled.join(', ') : null
}

/**
 * Ventanilla oficial de Defensa de las y los Consumidores. El link es
 * obligatorio en toda tienda online (Res. 1033/2021 SCI).
 */
export const CONSUMER_DEFENSE_URL = 'https://autogestion.produccion.gob.ar/consumidores'

/** Días corridos para ejercer el derecho de arrepentimiento (Ley 24.240, art. 34). */
export const CANCELLATION_WINDOW_DAYS = 10
