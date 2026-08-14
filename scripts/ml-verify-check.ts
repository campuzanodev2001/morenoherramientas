/**
 * Casos de prueba de las reglas de ml-verify.ts.
 *
 *   npm run ml:verify-check
 *
 * No pega contra la API: son pares nuestro/ML escritos a mano, varios sacados
 * de errores reales del catálogo (ver CLAUDE.md). Correrlo antes de tocar las
 * reglas de verificación — si se aflojan, acá se nota.
 */
import {
  extractDimensions,
  verifyCandidate,
  type Candidate,
  type VerifyOptions,
} from './ml-verify'

type Case = {
  label: string
  our: { name: string; brand: string | null }
  cand: Candidate
  expect: 'ok' | 'reject'
  options?: VerifyOptions
}

const c = (name: string, brand: string | null, models: string[] = []): Candidate => ({
  name,
  brand,
  models,
})

const CASES: Case[] = [
  {
    label: 'match legítimo, misma medida',
    our: { name: 'Llave Combinada 14mm', brand: 'Bremen' },
    cand: c('Llave Combinada Bremen 14mm Cr-V Espejada', 'Bremen'),
    expect: 'ok',
  },
  {
    label: 'medida distinta → contradicción',
    our: { name: 'Llave Combinada 14mm', brand: 'Bremen' },
    cand: c('Llave Combinada Bremen 16mm Cr-V', 'Bremen'),
    expect: 'reject',
  },
  {
    label: 'marca distinta',
    our: { name: 'Llave Combinada 14mm', brand: 'Rutmann' },
    cand: c('Llave Combinada Bremen 14mm', 'Bremen'),
    expect: 'reject',
  },
  {
    label: 'tipo distinto: pinza contra llave',
    our: { name: 'Llave Combinada 14mm', brand: 'Bremen' },
    cand: c('Pinza Universal Bremen 14mm', 'Bremen'),
    expect: 'reject',
  },
  {
    label: 'juego contra unidad suelta (la trampa clásica)',
    our: { name: 'Llave Combinada 14mm', brand: 'Bremen' },
    cand: c('Juego de Llaves Combinadas Bremen 8 10 12 14mm 6 Piezas', 'Bremen'),
    expect: 'reject',
  },
  {
    label: 'juego contra juego, misma cantidad',
    our: { name: 'Juego Llaves Combinadas 12 Piezas', brand: 'Bremen' },
    cand: c('Juego de Llaves Combinadas Bremen 12 Piezas Cr-V', 'Bremen'),
    expect: 'ok',
  },
  {
    label: 'decimal con coma contra decimal con punto',
    our: { name: 'Mecha HSS 11,50mm', brand: 'Bremen' },
    cand: c('Mecha Bremen HSS 11.50 mm Metal', 'Bremen'),
    expect: 'ok',
  },
  {
    label: 'sin dimensión en nuestro nombre → no se puede validar',
    our: { name: 'Destornillador Plano', brand: 'Bremen' },
    cand: c('Destornillador Plano Bremen Mango Bimaterial', 'Bremen'),
    expect: 'reject',
  },
  {
    label: 'encastre distinto',
    our: { name: 'Bocallave Enc 1/2 24mm', brand: 'Bremen' },
    cand: c('Bocallave Bremen Encastre 3/8 24mm', 'Bremen'),
    expect: 'reject',
  },
  {
    label: 'potencia distinta',
    our: { name: 'Amoladora Angular 850W', brand: 'Lusqtoff' },
    cand: c('Amoladora Angular Lusqtoff 750W 115mm', 'Lusqtoff'),
    expect: 'reject',
  },
  {
    label: 'marca con importador pegado',
    our: { name: 'Llave Combinada 14mm', brand: 'Bahco Argentina' },
    cand: c('Llave Combinada Bahco 14mm', 'Bahco'),
    expect: 'ok',
  },
  {
    label: 'rosca M16 contra M20',
    our: { name: 'Extractor de Volante M16', brand: 'Bremen' },
    cand: c('Extractor de Volante Bremen M20 Magnetico', 'Bremen'),
    expect: 'reject',
  },
  {
    label: 'sin marca nuestra → no se puede validar',
    our: { name: 'Llave Combinada 14mm', brand: null },
    cand: c('Llave Combinada Bremen 14mm', 'Bremen'),
    expect: 'reject',
  },
  {
    label: 'dimensión presente en ambos pero sin familia compartida',
    our: { name: 'Compresor 50 Lts', brand: 'Lusqtoff' },
    cand: c('Compresor Lusqtoff 2.5 Hp Correa', 'Lusqtoff'),
    expect: 'reject',
  },

  // ── Los seis errores reales que dejó pasar la primera versión ────────────
  {
    label: 'REGRESIÓN: color distinto (precinto negro contra blanco)',
    our: { name: 'Precinto Nylon 3.6x200mm Negro Crossmaster', brand: 'Crossmaster' },
    cand: c('Precinto Nylon 3.6x200mm Blanco Crossmaster', 'Crossmaster'),
    expect: 'reject',
  },
  {
    label: 'REGRESIÓN: mismo color, misma medida compuesta → sí matchea',
    our: { name: 'Precinto Nylon 3.6x250mm Negro Crossmaster', brand: 'Crossmaster' },
    cand: c('Precinto Nylon 3.6x250mm Negro Crossmaster', 'Crossmaster'),
    expect: 'ok',
  },
  {
    label: 'REGRESIÓN: medida compuesta distinta en el primer número',
    our: { name: 'Precinto Nylon 2.5x100mm Negro', brand: 'Crossmaster' },
    cand: c('Precinto Nylon 3.6x100mm Negro Crossmaster', 'Crossmaster'),
    expect: 'reject',
  },
  {
    label: 'REGRESIÓN: la ficha dice Largo y nuestro nombre no',
    our: { name: 'Bocallave Cross-Hex. 1/4-6 mm', brand: 'Crossmaster' },
    cand: c('Tubo Bocallave Hexagonal Largo 6 Mm Encastre 1/4 Crossmaster', 'Crossmaster'),
    expect: 'reject',
  },
  {
    label: 'REGRESIÓN: nuestro nombre dice LAR. y la ficha no',
    our: { name: 'Bocallave CROSS-HEX.LAR.1/4-6mm', brand: 'Crossmaster' },
    cand: c('Bocallave Tubo Hexagonal 1/4 6mm Crossmaster', 'Crossmaster'),
    expect: 'reject',
  },
  {
    label: 'REGRESIÓN: el sustantivo aparece como accesorio, no como producto',
    our: { name: 'Bocallave Crossmaster Hexag. 14mm Enc1/2', brand: 'Crossmaster' },
    cand: c('Llave Tipo T Con Bocallave Hexagonal 14mm Cr-v Crossmaster', 'Crossmaster'),
    expect: 'reject',
  },
  {
    label: 'REGRESIÓN: largo en metros distinto escrito de dos formas',
    // Sin color de por medio a propósito: lo que se prueba acá es que "8mtrs"
    // y "9m" se leen los dos como metros y se detecta que difieren.
    our: { name: 'Cinta Amarre Grande Davidson 50mm X 8mtrs', brand: 'Davidson' },
    cand: c('Cinta Amarre Davidson 9m 50mm 1000kg Zuncho', 'Davidson'),
    expect: 'reject',
  },
  {
    label: 'metros iguales escritos de dos formas → sí matchea',
    our: { name: 'Cinta Amarre Davidson 50mm X 8mtrs', brand: 'Davidson' },
    cand: c('Cinta Amarre Davidson 8m 50mm Zuncho', 'Davidson'),
    expect: 'ok',
  },
  {
    label: 'REGRESIÓN: encastre extra nuestro que la ficha no tiene',
    our: { name: 'Crique Corta 1/2 & 3/8 Doble Funcion Eurotech', brand: 'Eurotech' },
    cand: c("Llave Crique Corta Enc 1/2'' Con Expulsor Eurotech", 'Eurotech'),
    expect: 'reject',
  },
  {
    label: 'macho contra hembra',
    our: { name: 'Racord 1/4 Macho', brand: 'Alnat' },
    cand: c('Racord Alnat 1/4 Hembra Bronce', 'Alnat'),
    expect: 'reject',
  },

  // ── Segunda tanda de errores reales ──────────────────────────────────────
  {
    label: 'REGRESIÓN: perfil Ribe contra Spline',
    our: { name: 'Puntas x 4 - Ribe (Enc 1/2) Eurotech', brand: 'Eurotech' },
    cand: c('Puntas Spline Multiestria M10-18 Dado Enc. 1/2 Eurotech', 'Eurotech'),
    expect: 'reject',
  },
  {
    label: 'REGRESIÓN: unidad suelta contra pack de 10',
    our: { name: 'Bosch Cincel Plano SDS-Plus 250mm', brand: 'Bosch' },
    cand: c('Cincel Plano Bosch Plus 250mm 10und', 'Bosch'),
    expect: 'reject',
  },
  {
    label: 'REGRESIÓN: con crique contra llave fija de la misma medida',
    our: { name: 'Llave Combinada con Crique 11mm Bremen', brand: 'Bremen' },
    cand: c('Llave Combinada Bremen Milimetrica 11mm', 'Bremen'),
    expect: 'reject',
  },
  {
    label: 'REGRESIÓN: la ficha declara más encastres que el nuestro',
    our: { name: 'Prolongador x 3 - 1/4 - Eurotech', brand: 'Eurotech' },
    cand: c('Prolongador Eurotech vastago 1/4 a 1/4 3/8 1/2', 'Eurotech'),
    expect: 'reject',
  },
  {
    label: 'REGRESIÓN: el sustantivo no puede ser la marca',
    our: { name: 'Bosch Cincel Plano SDS-Plus 250mm', brand: 'Bosch' },
    cand: c('Bosch Amoladora Angular 250mm', 'Bosch'),
    expect: 'reject',
  },
  {
    label: 'crique contra crique → sí matchea',
    our: { name: 'Llave Combinada con Crique 9mm Bremen', brand: 'Bremen' },
    cand: c('Llave Combinada Con Crique 9mm Bremen', 'Bremen'),
    expect: 'ok',
  },
  {
    // El código en el título de ML no siempre es el código de fábrica de esa
    // pieza. Sin esta regla, el destapizador se lleva la foto de una llave.
    label: 'REGRESIÓN: el código no puede saltear el chequeo de tipo',
    our: { name: 'Destapizador 8 Grande Eurotech', brand: 'Eurotech' },
    cand: c('Llave Estructurada Eurotech 3280', 'Eurotech'),
    expect: 'reject',
    options: { codeEvidence: true },
  },
  {
    label: 'REGRESIÓN: medida de Torx distinta (T25 contra T50)',
    our: { name: 'Bocallave Cross-Punta Torx T25 -1/2', brand: 'Crossmaster' },
    cand: c('Bocallave Punta Torx Encastre 1/2 T50 Crossmaster', 'Crossmaster'),
    expect: 'reject',
  },
  {
    label: 'misma medida de Torx → sí matchea',
    our: { name: 'Bocallave Cross-Punta Torx T25 -1/2', brand: 'Crossmaster' },
    cand: c('Bocallave Punta Torx Encastre 1/2 T25 Crossmaster', 'Crossmaster'),
    expect: 'ok',
  },
  {
    label: 'REGRESIÓN: norma de electrodo distinta (6013 contra 6010)',
    our: { name: 'Electrodo Sideral 6013 4mm X kg', brand: 'Sideral' },
    cand: c('Electrodo para soldadura Sideral 6010 4 mm', 'Sideral'),
    expect: 'reject',
  },
  {
    label: 'misma norma de electrodo → sí matchea',
    our: { name: 'Electrodo Sideral 6013 4mm X kg', brand: 'Sideral' },
    cand: c('Electrodo para soldadura Sideral 6013 4 mm', 'Sideral'),
    expect: 'ok',
  },
  {
    label: 'REGRESIÓN: multimaterial contra bimetálica (misma medida)',
    our: { name: 'Sierra Copa Multi Material 59mm Bosch', brand: 'Bosch' },
    cand: c('Sierra Copa Bimetálica 59mm C/ Cobalto Bosch', 'Bosch'),
    expect: 'reject',
  },
  {
    label: 'Progressor es la multimaterial de Bosch → sí matchea',
    our: { name: 'Sierra Copa Multi Material 27mm Bosch', brand: 'Bosch' },
    cand: c('Sierra Copa Progressor 27mm Bosch', 'Bosch'),
    expect: 'ok',
  },
  {
    label: 'REGRESIÓN: modelos compatibles distintos en las grapas',
    our: { name: 'Grapas 5/16 para TR35, TR40 Stanley', brand: 'Stanley' },
    cand: c('Grapas Para Trabajo Pesado 5/16 Stanley Tra705t', 'Stanley'),
    expect: 'reject',
  },
  {
    label: 'código del vendedor en la ficha que no está en el nuestro → no molesta',
    our: { name: 'Lima Bremen Redonda Bastarda 8 pulg C/Cabo', brand: 'Bremen' },
    cand: c('Lima Para Metal Bremen Redonda Bastarda 8 PuLG 4598 Fs', 'Bremen'),
    expect: 'ok',
  },
  {
    label: 'código + tipo coherente y sin dimensión → sí matchea',
    our: { name: 'Cubo para Caliper de Freno Eurotech', brand: 'Eurotech' },
    cand: c('Cubo Compresor Caliper Freno Eurotech Universal', 'Eurotech'),
    expect: 'ok',
    options: { codeEvidence: true },
  },
]

let pass = 0
let fail = 0
for (const test of CASES) {
  const verdict = verifyCandidate(test.our, test.cand, test.options ?? {})
  const got = verdict.ok ? 'ok' : 'reject'
  const good = got === test.expect
  if (good) pass++
  else fail++
  const detail = verdict.ok ? verdict.evidence.join(' · ') : verdict.reason
  console.log(`${good ? 'PASS' : 'FALLA'}  esperado=${test.expect} obtuvo=${got}  ${test.label}`)
  console.log(`        ${detail}`)
}

console.log(`\n${pass} pasan · ${fail} fallan`)
if (fail > 0) process.exitCode = 1

// Inspección suelta del extractor, para ver qué lee de cada nombre.
for (const name of [
  'Llave Corta Combinada -14mm',
  'Bocallave Enc 1/2 24mm',
  'Mecha HSS 11,50mm',
  'Sierra Ingletadora 210mm - 1250W',
  'Extractor de Volante Magnetico M16',
  'Compresor 50 lts 2.5 Hp',
  'Enc 1/2',
]) {
  const dims = [...extractDimensions(name)].map(([k, v]) => `${k}=${[...v].join('/')}`)
  console.log(`${name.padEnd(40)} → ${dims.join(' ')}`)
}
