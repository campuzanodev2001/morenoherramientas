/**
 * Specs desde catálogos con formato "ficha por producto".
 *
 *   npx tsx scripts/enrich-catalog.ts lusqtoff
 *
 * A diferencia del catálogo Bremen (columnas apiladas, ver enrich-bremen.ts),
 * estos catálogos traen cada producto como un bloque autocontenido:
 *
 *   AMOLADORA ANGULAR 1400 W • AML1400-9
 *   • Tensión: 220 V ~ 50 Hz.
 *   • Potencia: 1400 W
 *   • Peso: 2,75 Kg
 *
 * Es un formato mucho más seguro: no hay reparto de columnas entre familias,
 * así que no existe el riesgo de pegarle a un producto las medidas de otro.
 * El único riesgo real es que la ventana de texto se pase al producto
 * siguiente, y eso se acota cortando en el próximo código conocido.
 *
 * Igual que con Bremen, todo lo extraído se contrasta contra el nombre del
 * propio producto y si hay contradicción se descarta.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import type { ProductSpec } from '@/lib/db/schemas/products'

type Source = { brand: string; file: string; fuente: string }

const SOURCES: Record<string, Source> = {
  lusqtoff: {
    brand: 'Lusqtoff',
    file: 'data/lusqtoff-catalogo.txt',
    fuente: 'Catálogo oficial Lüsqtoff 2024-2025',
  },
}

/** Etiquetas del catálogo que van a la ficha, con su forma de mostrar. */
const LABELS: Record<string, string> = {
  potencia: 'Potencia',
  tension: 'Tensión',
  voltaje: 'Tensión',
  velocidad: 'Velocidad',
  'velocidad nominal': 'Velocidad',
  'velocidad variable': 'Velocidad',
  peso: 'Peso',
  material: 'Material',
  capacidad: 'Capacidad',
  'capacidad del motor': 'Capacidad del motor',
  motor: 'Motor',
  cilindrada: 'Cilindrada',
  arranque: 'Arranque',
  'presion de trabajo': 'Presión de trabajo',
  'presion maxima': 'Presión máxima',
  caudal: 'Caudal',
  'tanque de combustible': 'Tanque de combustible',
  tipo: 'Tipo',
  tamano: 'Tamaño',
  rosca: 'Rosca',
  amperaje: 'Amperaje',
  aperaje: 'Amperaje',
  'amper bateria': 'Amperaje de batería',
  'diametro maximo de disco': 'Diámetro máximo de disco',
  'diametro del disco': 'Diámetro del disco',
  'diametro max de disco': 'Diámetro máximo de disco',
  'modo de operacion': 'Modo de operación',
  'fuente de alimentacion': 'Fuente de alimentación',
  'corriente de entrada nominal': 'Corriente de entrada',
  'capacidad de entrada nominal': 'Capacidad de entrada',
  'longitud de corte': 'Longitud de corte',
  'ancho de corte': 'Ancho de corte',
  'profundidad de corte': 'Profundidad de corte',
  frecuencia: 'Frecuencia',
  temperatura: 'Temperatura',
  autonomia: 'Autonomía',
}

/** Datos comerciales o de logística: no van a la ficha del comprador. */
const SKIP_LABELS = new Set(['minimo de venta', 'incluye', 'garantia', 'codigo', 'precio', 'pag'])

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normLabel(s: string): string {
  return deaccent(s).toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim()
}

type CleanProduct = { sku: string; name: string; brand: string | null; specs: ProductSpec[] }

/** Compara lo extraído contra el nombre: potencia y tensión son contrastables. */
function crossCheck(name: string, specs: ProductSpec[]): { agree: number; conflict: string[] } {
  const n = name.toLowerCase().replace(/\./g, '').replace(/,/g, '.')
  let agree = 0
  const conflict: string[] = []

  const num = (v: string): string | null => /(\d+(?:[.,]\d+)?)/.exec(v.replace(/\./g, '').replace(',', '.'))?.[1] ?? null

  const pot = specs.find((s) => s.label === 'Potencia')
  if (pot) {
    const w = num(pot.value)
    const inName = [...n.matchAll(/(\d+(?:\.\d+)?)\s*w\b/g)].map((m) => m[1])
    if (w !== null && inName.length > 0) {
      if (inName.includes(w)) agree++
      else conflict.push(`Potencia ${pot.value} pero el nombre dice ${inName.join('/')}W`)
    }
  }

  const ten = specs.find((s) => s.label === 'Tensión')
  if (ten) {
    const v = num(ten.value)
    const inName = [...n.matchAll(/(\d+)\s*v\b/g)].map((m) => m[1])
    if (v !== null && inName.length > 0) {
      if (inName.includes(v)) agree++
      else conflict.push(`Tensión ${ten.value} pero el nombre dice ${inName.join('/')}V`)
    }
  }

  return { agree, conflict }
}

type Enriched = {
  sku: string
  name: string
  codigoFabrica: string
  specs: ProductSpec[]
  description: string | null
  fuente: string
  confianza: 'confirmado' | 'sin-contraste'
}

function main(): void {
  const key = process.argv[2] ?? ''
  const source = SOURCES[key]
  if (!source) {
    console.error(`Fuente desconocida: "${key}". Disponibles: ${Object.keys(SOURCES).join(', ')}`)
    process.exit(1)
  }

  const text = readFileSync(source.file, 'utf8')
  const base = JSON.parse(readFileSync('data/productos-limpios.json', 'utf8')) as CleanProduct[]
  const brandProducts = base.filter((p) => p.brand === source.brand)

  // El catálogo titula cada producto como "NOMBRE DEL PRODUCTO • CÓDIGO".
  // Cortar por esos encabezados es lo único confiable: tomar una ventana de N
  // caracteres después del código se pasa al producto siguiente y le roba las
  // specs (una amoladora de 550 W terminaba con "Potencia: 2000 W").
  const lines = text.split('\n')
  const blocks = new Map<string, string>()
  let currentCode: string | null = null
  let buffer: string[] = []

  const flush = (): void => {
    if (currentCode !== null && !blocks.has(currentCode)) blocks.set(currentCode, buffer.join('\n'))
    buffer = []
  }

  for (const line of lines) {
    const header = /^\s*(.{4,60}?)\s*[•·]\s*([A-Z][A-Z0-9]{1,8}[-.]?[A-Z0-9.\-]{0,10})\s*$/.exec(line)
    if (header?.[2]) {
      flush()
      currentCode = header[2].toUpperCase()
      continue
    }
    if (currentCode !== null) buffer.push(line)
  }
  flush()

  const enriched: Enriched[] = []
  const sinCodigo: CleanProduct[] = []
  const sinFicha: { sku: string; name: string; code: string }[] = []
  const rechazados: { sku: string; name: string; code: string; motivo: string[] }[] = []

  for (const p of brandProducts) {
    const code = p.specs.find((s) => s.label === 'Código de fábrica')?.value
    if (code === undefined) {
      sinCodigo.push(p)
      continue
    }

    const window = blocks.get(code.toUpperCase())
    if (window === undefined) {
      sinFicha.push({ sku: p.sku, name: p.name, code })
      continue
    }

    const specs: ProductSpec[] = [{ label: 'Código de fábrica', value: code }]
    const seen = new Set<string>()
    for (const m of window.matchAll(/[•·]\s*([A-Za-zÁÉÍÓÚÑáéíóúñ .]{3,34}):\s*([^\n•·]{1,60})/g)) {
      const raw = normLabel(m[1] ?? '')
      if (SKIP_LABELS.has(raw)) continue
      const display = LABELS[raw]
      const value = (m[2] ?? '').trim().replace(/\.$/, '')
      if (display === undefined || value === '' || seen.has(display)) continue
      seen.add(display)
      specs.push({ label: display, value })
    }

    if (specs.length === 1) {
      sinFicha.push({ sku: p.sku, name: p.name, code })
      continue
    }

    const { agree, conflict } = crossCheck(p.name, specs)
    if (conflict.length > 0) {
      rechazados.push({ sku: p.sku, name: p.name, code, motivo: conflict })
      continue
    }

    enriched.push({
      sku: p.sku,
      name: p.name,
      codigoFabrica: code,
      specs,
      description: null,
      fuente: source.fuente,
      confianza: agree > 0 ? 'confirmado' : 'sin-contraste',
    })
  }

  const out = `data/specs-${key}.json`
  writeFileSync(out, JSON.stringify(enriched, null, 2) + '\n')

  const report = [
    `ENRIQUECIMIENTO ${source.brand.toUpperCase()}`,
    `Fuente: ${source.fuente}`,
    '',
    `Productos de la marca:      ${brandProducts.length}`,
    `  resueltos:                ${enriched.length}`,
    `    confirmados por nombre: ${enriched.filter((e) => e.confianza === 'confirmado').length}`,
    `  sin código de fábrica:    ${sinCodigo.length}`,
    `  sin ficha en el catálogo: ${sinFicha.length}`,
    `  rechazados por conflicto: ${rechazados.length}`,
    '',
    '--- RECHAZADOS ---',
    ...(rechazados.length === 0
      ? ['  ninguno']
      : rechazados.map((x) => `  [${x.sku}] ${x.code} — ${x.name}\n      ${x.motivo.join(' | ')}`)),
    '',
  ].join('\n')
  writeFileSync(`data/reporte-${key}.txt`, report)
  console.log(report)
  console.log(`Specs → ${out}`)
}

main()
