/**
 * Chequea qué datos del negocio siguen sin cargar en `lib/store/business.ts`.
 * Varios son obligatorios por ley para vender online en Argentina, así que
 * conviene correrlo antes de cada deploy a producción.
 *
 *   npx tsx scripts/check-business-data.ts
 *
 * Sale con código 1 si falta alguno de los obligatorios, para poder engancharlo
 * a un check de CI si algún día se quiere.
 */

import { business, socials, isPending } from '@/lib/store/business'

type Check = { label: string; value: string; required: boolean; why: string }

const checks: Check[] = [
  {
    label: 'Razón social',
    value: business.legalName,
    required: true,
    why: 'Ley 24.240 art. 4 — identificación del proveedor',
  },
  { label: 'CUIT', value: business.cuit, required: true, why: 'identificación fiscal del titular' },
  {
    label: 'Domicilio (calle)',
    value: business.address.street,
    required: true,
    why: 'domicilio comercial obligatorio',
  },
  { label: 'Domicilio (localidad)', value: business.address.city, required: true, why: 'domicilio comercial' },
  { label: 'Domicilio (provincia)', value: business.address.province, required: true, why: 'domicilio comercial' },
  { label: 'Domicilio (CP)', value: business.address.postalCode, required: false, why: 'completa el domicilio' },
  {
    label: 'Data Fiscal (URL)',
    value: business.dataFiscalUrl,
    required: true,
    why: 'ARCA formulario 960/D — obligatorio en e-commerce',
  },
  {
    label: 'Email de contacto',
    value: business.email,
    required: true,
    why: 'canal de reclamos + destinatario de los avisos de arrepentimiento',
  },
  { label: 'WhatsApp', value: business.whatsapp, required: false, why: 'canal de atención' },
  { label: 'Teléfono', value: business.phone, required: false, why: 'canal de atención' },
  { label: 'Horario de atención', value: business.hours, required: false, why: 'informativo' },
  ...socials.map((s) => ({
    label: `${s.label} (URL)`,
    value: s.url as string,
    required: false,
    why: 'redes sociales del footer',
  })),
]

function main(): void {
  const missingRequired = checks.filter((c) => c.required && isPending(c.value))
  const missingOptional = checks.filter((c) => !c.required && isPending(c.value))
  const ok = checks.filter((c) => !isPending(c.value))

  console.log('\n=== Datos del negocio ===\n')

  if (ok.length > 0) {
    console.log(`✅ Cargados (${ok.length}):`)
    for (const c of ok) console.log(`   ${c.label}`)
    console.log('')
  }

  if (missingRequired.length > 0) {
    console.log(`🔴 FALTAN — obligatorios (${missingRequired.length}):`)
    for (const c of missingRequired) console.log(`   ${c.label}  →  ${c.why}`)
    console.log('')
  }

  if (missingOptional.length > 0) {
    console.log(`🟡 Faltan — opcionales (${missingOptional.length}):`)
    for (const c of missingOptional) console.log(`   ${c.label}  →  ${c.why}`)
    console.log('')
  }

  if (missingRequired.length === 0 && missingOptional.length === 0) {
    console.log('🎉 Está todo cargado.\n')
    return
  }

  console.log('Cargalos en lib/store/business.ts\n')
  if (missingRequired.length > 0) process.exitCode = 1
}

main()
