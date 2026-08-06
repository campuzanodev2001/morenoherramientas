/**
 * Arma la ficha técnica de cada producto y la aplica a la DB.
 *
 *   npx tsx --env-file=.env.local scripts/apply-specs.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/apply-specs.ts
 *
 * Combina, por orden de confianza:
 *   1. Specs de catálogo oficial de la marca (data/specs-<marca>.json)
 *   2. Specs que ya están escritas en el nombre del propio producto
 *
 * Nunca inventa un dato. Lo derivado del nombre sale del texto que cargó el
 * cliente, no de una inferencia sobre qué debería tener el producto.
 *
 * La procedencia de cada spec queda en data/procedencia-specs.json, no en la
 * ficha que ve el comprador.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schemas'
import type { ProductSpec } from '@/lib/db/schemas/products'

const PRODUCTS = 'data/productos-limpios.json'
const BRAND_FILES = ['data/specs-bremen.json', 'data/specs-lusqtoff.json']
const OUT_PROVENANCE = 'data/procedencia-specs.json'
const OUT_REPORT = 'data/reporte-specs.txt'

type CleanProduct = { sku: string; name: string; brand: string | null; specs: ProductSpec[] }
type BrandSpecs = {
  sku: string
  specs: ProductSpec[]
  description: string | null
  fuente: string
  confianza: string
}

// ---------------------------------------------------------------------------
// Specs que ya vienen escritas en el nombre
// ---------------------------------------------------------------------------

const MATERIALS: [RegExp, string][] = [
  [/\bcr\s*-?\s*va\b|\bcromo\s*vanadio\b/i, 'Cr-V'],
  [/\bcr\s*-?\s*mo\b|\bcromo\s*molibdeno\b/i, 'Cr-Mo'],
  [/\bhss\b/i, 'HSS'],
  [/\binox(?:idable)?\b/i, 'Acero inoxidable'],
  [/\bbronce\b/i, 'Bronce'],
  [/\baluminio\b/i, 'Aluminio'],
  [/\bfibra\s*de\s*vidrio\b/i, 'Fibra de vidrio'],
]

/**
 * Extrae del nombre solo lo que está escrito de forma inequívoca. Ante más de
 * una lectura posible (por ejemplo dos medidas en mm sin saber cuál es cuál),
 * no extrae nada: es preferible una ficha corta que una incorrecta.
 */
function specsFromName(name: string): ProductSpec[] {
  const out: ProductSpec[] = []
  const n = name.replace(/\s+/g, ' ')

  const potencia = [...new Set([...n.matchAll(/(\d+(?:[.,]\d+)?)\s*W\b/g)].map((m) => m[1]))]
  if (potencia.length === 1 && potencia[0]) out.push({ label: 'Potencia', value: `${potencia[0]} W` })

  const tension = [...new Set([...n.matchAll(/(\d+)\s*V\b/g)].map((m) => m[1]))]
  if (tension.length === 1 && tension[0]) out.push({ label: 'Tensión', value: `${tension[0]} V` })

  const encastre = [...new Set([...n.matchAll(/\benc\.?\s*(\d\/\d)/gi)].map((m) => m[1]))]
  if (encastre.length === 1 && encastre[0]) out.push({ label: 'Encastre', value: `${encastre[0]}"` })

  // Solo si hay una única medida en mm: con dos no se sabe cuál es la medida
  // de la herramienta y cuál el largo.
  const mm = [...new Set([...n.matchAll(/(\d+(?:[.,]\d+)?)\s*mm\b/gi)].map((m) => m[1]))]
  if (mm.length === 1 && mm[0]) out.push({ label: 'Medida', value: `${mm[0]} mm` })

  const pulg = [...new Set([...n.matchAll(/(\d+(?:\s*\d\/\d)?)\s*pulg\b/gi)].map((m) => m[1]))]
  if (pulg.length === 1 && pulg[0]) out.push({ label: 'Medida', value: `${pulg[0].trim()}"` })

  const piezas = [...new Set([...n.matchAll(/(\d+)\s*(?:pz|pzs|pza|pzas|pcs)\b/gi)].map((m) => m[1]))]
  if (piezas.length === 1 && piezas[0]) out.push({ label: 'Piezas', value: piezas[0] })

  const ton = /(\d+(?:[.,]\d+)?)\s*(?:tn|ton)\b/i.exec(n)
  if (ton?.[1]) out.push({ label: 'Capacidad', value: `${ton[1]} Tn` })

  const lts = /(\d+(?:[.,]\d+)?)\s*(?:lts?|litros)\b/i.exec(n)
  if (lts?.[1]) out.push({ label: 'Capacidad', value: `${lts[1]} litros` })

  const rpm = /(\d+(?:\.\d+)?)\s*rpm\b/i.exec(n)
  if (rpm?.[1]) out.push({ label: 'Velocidad', value: `${rpm[1]} rpm` })

  const nm = /(\d+(?:[.,]\d+)?)\s*Nm\b/i.exec(n)
  if (nm?.[1]) out.push({ label: 'Torque', value: `${nm[1]} Nm` })

  const bar = /(\d+(?:[.,]\d+)?)\s*bar\b/i.exec(n)
  if (bar?.[1]) out.push({ label: 'Presión', value: `${bar[1]} bar` })

  const psi = /(\d+(?:[.,]\d+)?)\s*psi\b/i.exec(n)
  if (psi?.[1]) out.push({ label: 'Presión', value: `${psi[1]} psi` })

  const hp = /(\d+(?:[.,]\d+)?)\s*hp\b/i.exec(n)
  if (hp?.[1]) out.push({ label: 'Potencia', value: `${hp[1]} HP` })

  const ah = /(\d+(?:[.,]\d+)?)\s*ah\b/i.exec(n)
  if (ah?.[1]) out.push({ label: 'Batería', value: `${ah[1]} Ah` })

  const cc = /(\d+(?:[.,]\d+)?)\s*cc\b/i.exec(n)
  if (cc?.[1]) out.push({ label: 'Cilindrada', value: `${cc[1]} cc` })

  const gr = /(\d+(?:[.,]\d+)?)\s*(?:gr|g)\b/i.exec(n)
  if (gr?.[1]) out.push({ label: 'Contenido', value: `${gr[1]} g` })

  const ml = /(\d+(?:[.,]\d+)?)\s*(?:ml|cc)\b/i.exec(n)
  if (ml?.[1] && gr === null) out.push({ label: 'Contenido', value: `${ml[1]} ml` })

  const kg = /(\d+(?:[.,]\d+)?)\s*kg\b/i.exec(n)
  if (kg?.[1]) out.push({ label: 'Peso', value: `${kg[1]} kg` })

  const mts = /(\d+(?:[.,]\d+)?)\s*(?:mts|metros|m)\b/.exec(n)
  if (mts?.[1]) out.push({ label: 'Largo', value: `${mts[1]} m` })

  // Tipo de punta, que el nombre del rubro escribe siempre igual.
  if (/\btorx\b/i.test(n)) out.push({ label: 'Tipo de punta', value: 'Torx' })
  else if (/\bphil?l?ips\b|\bph\d\b|\bpz\d\b/i.test(n)) out.push({ label: 'Tipo de punta', value: 'Phillips' })
  else if (/\ballen\b|hexagonal/i.test(n)) out.push({ label: 'Tipo de punta', value: 'Hexagonal' })

  if (/\bcorta\b/i.test(n)) out.push({ label: 'Longitud', value: 'Corta' })
  else if (/\blarga?\b/i.test(n)) out.push({ label: 'Longitud', value: 'Larga' })

  for (const [re, value] of MATERIALS) {
    if (re.test(n)) {
      out.push({ label: 'Material', value })
      break
    }
  }

  // Una sola spec por etiqueta: gana la primera encontrada.
  const seen = new Set<string>()
  return out.filter((s) => (seen.has(s.label) ? false : (seen.add(s.label), true)))
}

// ---------------------------------------------------------------------------
// Descripciones
// ---------------------------------------------------------------------------

/**
 * Cómo se lee cada material en prosa. Son equivalencias del rubro, no una
 * interpretación: "Cr-V" es acero cromo-vanadio y nada más.
 */
const MATERIAL_PROSE: Record<string, string> = {
  'Cr-V': 'acero cromo-vanadio (Cr-V)',
  'Cr-Mo': 'acero cromo-molibdeno (Cr-Mo)',
  'Ac-C': 'acero al carbono',
  HSS: 'acero rápido (HSS)',
  'Acero inoxidable': 'acero inoxidable',
  Bronce: 'bronce',
  Aluminio: 'aluminio',
  'Fibra de vidrio': 'fibra de vidrio',
}

/** Specs que se cuentan en la frase de características, en este orden. */
const PROSE_ORDER = [
  'Medida', 'Encastre', 'Largo', 'Diámetro', 'Ancho', 'Espesor', 'Piezas',
  'Potencia', 'Tensión', 'Velocidad', 'Torque', 'Presión', 'Caudal',
  'Capacidad', 'Cilindrada', 'Batería', 'Contenido', 'Peso', 'Precisión',
  'Tipo de punta', 'Aislación', 'Rosca', 'Color',
]

/** Saca la marca del final del nombre para no repetirla en la frase. */
function nameWithoutBrand(name: string, brand: string | null): string {
  if (brand === null) return name
  const re = new RegExp(`[\\s\\-–—,]*${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*®?\\s*$`, 'i')
  return name.replace(re, '').trim() || name
}

/**
 * Arma la descripción con lo que se sabe del producto y nada más. No infiere
 * usos, materiales ni prestaciones: si el dato no está verificado, no aparece.
 */
function buildDescription(
  name: string,
  brand: string | null,
  specs: ProductSpec[],
  fromCatalog: string | null,
): string {
  const parts: string[] = []
  const clean = nameWithoutBrand(name, brand)

  parts.push(brand !== null ? `${clean} de ${brand}.` : `${clean}.`)

  // Texto del propio fabricante, cuando el catálogo lo trae.
  if (fromCatalog !== null && fromCatalog.trim() !== '') {
    const t = fromCatalog.trim()
    parts.push(t.endsWith('.') ? t : `${t}.`)
  }

  const byLabel = new Map(specs.map((s) => [s.label, s.value]))
  const material = byLabel.get('Material')

  const bits: string[] = []
  for (const label of PROSE_ORDER) {
    const value = byLabel.get(label)
    if (value === undefined) continue
    bits.push(`${label.toLowerCase()} ${value}`)
  }

  if (bits.length > 0) {
    const list =
      bits.length === 1
        ? (bits[0] ?? '')
        : `${bits.slice(0, -1).join(', ')} y ${bits[bits.length - 1]}`
    parts.push(`${list.charAt(0).toUpperCase()}${list.slice(1)}.`)
  }

  if (material !== undefined) {
    parts.push(`Fabricada en ${MATERIAL_PROSE[material] ?? material.toLowerCase()}.`)
  }

  return parts.join(' ')
}

// ---------------------------------------------------------------------------

type Provenance = {
  sku: string
  name: string
  origen: 'catalogo-marca' | 'nombre-producto' | 'sin-datos'
  fuente: string | null
  confianza: string | null
  cantidadSpecs: number
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')

  const base = JSON.parse(readFileSync(PRODUCTS, 'utf8')) as CleanProduct[]

  const brandSpecs = new Map<string, BrandSpecs>()
  for (const file of BRAND_FILES) {
    if (!existsSync(file)) continue
    const rows = JSON.parse(readFileSync(file, 'utf8')) as BrandSpecs[]
    for (const r of rows) brandSpecs.set(r.sku, r)
  }

  const updates: { sku: string; specs: ProductSpec[]; description: string | null }[] = []
  const provenance: Provenance[] = []

  for (const p of base) {
    const codigo = p.specs.find((s) => s.label === 'Código de fábrica')
    const fromBrand = brandSpecs.get(p.sku)

    if (fromBrand) {
      // El catálogo manda, pero si no cubrió algún dato que el nombre sí trae,
      // se completa con eso en vez de dejarlo afuera.
      const have = new Set(fromBrand.specs.map((s) => s.label))
      const extra = specsFromName(p.name).filter((s) => !have.has(s.label))
      const specs = [...fromBrand.specs, ...extra]
      if (p.brand !== null) specs.push({ label: 'Marca', value: p.brand })

      updates.push({
        sku: p.sku,
        specs,
        description: buildDescription(p.name, p.brand, specs, fromBrand.description),
      })
      provenance.push({
        sku: p.sku,
        name: p.name,
        origen: 'catalogo-marca',
        fuente: fromBrand.fuente,
        confianza: fromBrand.confianza,
        cantidadSpecs: specs.length - (codigo ? 1 : 0),
      })
      continue
    }

    const derived = specsFromName(p.name)
    const specs: ProductSpec[] = [...(codigo ? [codigo] : []), ...derived]
    // La marca es un dato verificado y le sirve al comprador en la ficha.
    if (p.brand !== null) specs.push({ label: 'Marca', value: p.brand })

    updates.push({
      sku: p.sku,
      specs,
      description: buildDescription(p.name, p.brand, specs, null),
    })
    provenance.push({
      sku: p.sku,
      name: p.name,
      origen: derived.length > 0 ? 'nombre-producto' : 'sin-datos',
      fuente: derived.length > 0 ? 'Nombre del producto (datos del cliente)' : null,
      confianza: derived.length > 0 ? 'derivado' : null,
      cantidadSpecs: derived.length,
    })
  }

  writeFileSync(OUT_PROVENANCE, JSON.stringify(provenance, null, 2) + '\n')

  const porCatalogo = provenance.filter((p) => p.origen === 'catalogo-marca')
  const porNombre = provenance.filter((p) => p.origen === 'nombre-producto')
  const sinDatos = provenance.filter((p) => p.origen === 'sin-datos')
  const conDesc = updates.filter((u) => u.description !== null)
  const muestra = [0, 200, 500, 900, 1300, 1700].flatMap((i) => {
    const u = updates[i]
    return u ? [`  [${u.sku}] ${u.description ?? ''}`] : []
  })

  const report = [
    'FICHAS TÉCNICAS — origen de los datos',
    '',
    `Productos:                       ${base.length}`,
    `  con specs de catálogo oficial: ${porCatalogo.length}`,
    `  con specs desde el nombre:     ${porNombre.length}`,
    `  sin specs propias (solo marca):${sinDatos.length}`,
    `  con descripción:               ${conDesc.length}`,
    '',
    '--- MUESTRA DE DESCRIPCIONES ---',
    ...muestra,
    '',
    'Ningún dato fue inventado: o viene del catálogo de la marca, o estaba',
    'escrito en el nombre que cargó el cliente.',
    '',
    '--- SIN SPECS PROPIAS: no hay fuente y el nombre no aporta datos.',
    '    Llevan marca y descripción, pero la ficha técnica queda mínima ---',
    ...sinDatos.slice(0, 400).map((p) => `  [${p.sku}] ${p.name}`),
    ...(sinDatos.length > 400 ? [`  ... y ${sinDatos.length - 400} más`] : []),
    '',
  ].join('\n')
  writeFileSync(OUT_REPORT, report)
  console.log(report.split('\n').slice(0, 14).join('\n'))

  if (dryRun) {
    console.log('\n--dry-run: no se escribió en la DB.')
    process.exit(0)
  }

  // Upsert por lotes: una sentencia cada 100 filas. Ir de a un UPDATE por
  // producto contra el pooler de Supabase tarda muchísimo para 1743 filas.
  const bySku = new Map(base.map((b) => [b.sku, b]))
  const full = JSON.parse(readFileSync(PRODUCTS, 'utf8')) as (CleanProduct & {
    slug: string
    price: number
    stock: number
    active: boolean
  })[]
  const fullBySku = new Map(full.map((f) => [f.sku, f]))

  let written = 0
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100).flatMap((u) => {
      const f = fullBySku.get(u.sku)
      const b = bySku.get(u.sku)
      if (!f || !b) return []
      return [
        {
          sku: u.sku,
          slug: f.slug,
          name: f.name,
          price: f.price,
          stock: f.stock,
          brand: f.brand,
          active: f.active,
          specs: u.specs,
          description: u.description,
        },
      ]
    })
    if (batch.length === 0) continue

    await db
      .insert(products)
      .values(batch)
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          specs: sql`excluded.specs`,
          description: sql`coalesce(excluded.description, ${products.description})`,
          updatedAt: sql`now()`,
        },
      })
    written += batch.length
    console.log(`  ${written}/${updates.length}`)
  }
  console.log(`\nActualizados: ${written}`)
  console.log(`Procedencia → ${OUT_PROVENANCE}`)
  process.exit(0)
}

main().catch((error: unknown) => {
  console.error('Error aplicando specs:', error)
  process.exit(1)
})
