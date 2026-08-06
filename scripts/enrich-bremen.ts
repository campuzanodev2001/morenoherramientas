/**
 * Specs reales para los productos Bremen, desde el catálogo oficial de la marca.
 *
 *   npx tsx scripts/enrich-bremen.ts
 *
 * Entrada:  data/bremen-catalogo.txt  (texto del PDF oficial de Bremen)
 *           data/productos-limpios.json
 * Salida:   data/specs-bremen.json    (specs + descripción por sku, con fuente)
 *           data/reporte-bremen.txt   (qué se resolvió y qué no, y por qué)
 *
 * El texto se extrajo una vez del PDF con:
 *   pypdf → una página por bloque, separadas por "<<<PAGINA n>>>"
 *
 * CÓMO ESTÁ ARMADO EL CATÁLOGO
 * El PDF es tabular y al pasarlo a texto queda como columnas apiladas: una
 * etiqueta y debajo sus valores. Las columnas de una misma familia de productos
 * están alineadas por posición:
 *
 *   CÓDIGO   3460 3461 3462 ...     MATERIAL   Cr-V
 *   MEDIDA   8 mm 9 mm 10 mm ...    ENCASTRE   1/2"
 *
 * Es decir: una columna con tantos valores como códigos es específica de cada
 * variante (el código i-ésimo tiene el valor i-ésimo), y una columna con un
 * solo valor es compartida por toda la familia.
 *
 * DE DÓNDE VIENE EL RIESGO
 * Si una página trae dos familias de productos, el orden del texto no alcanza
 * para saber a cuál pertenece cada columna, y una asignación cruzada le pondría
 * a un producto las medidas de otro: un error silencioso, peor que no tener
 * specs. Por eso, ante cualquier ambigüedad se descarta la columna, y además
 * todo lo que se asigna se contrasta contra el nombre del propio producto.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import type { ProductSpec } from '@/lib/db/schemas/products'

const CATALOG = 'data/bremen-catalogo.txt'
const PRODUCTS = 'data/productos-limpios.json'
const OUT_JSON = 'data/specs-bremen.json'
const OUT_REPORT = 'data/reporte-bremen.txt'

const FUENTE = 'Catálogo oficial Bremen 2025'

/** Etiquetas técnicas que sí le sirven al comprador, con su forma de mostrar. */
const TECH_LABELS: Record<string, string> = {
  MEDIDA: 'Medida',
  LARGO: 'Largo',
  ANCHO: 'Ancho',
  ALTO: 'Alto',
  ESPESOR: 'Espesor',
  MATERIAL: 'Material',
  'MATERIAL MANGO': 'Material del mango',
  ENCASTRE: 'Encastre',
  PIEZAS: 'Piezas',
  CAPACIDAD: 'Capacidad',
  DIÁMETRO: 'Diámetro',
  PESO: 'Peso',
  MODELO: 'Modelo',
  ROSCA: 'Rosca',
  COLOR: 'Color',
  AISLACIÓN: 'Aislación',
  PUNTA: 'Punta',
  VÁSTAGO: 'Vástago',
  'MEDIDA CUCHILLA': 'Medida de la cuchilla',
  'U. MEDIDA': 'Unidad de medida',
  PRECISIÓN: 'Precisión',
  POTENCIA: 'Potencia',
  TENSIÓN: 'Tensión',
  CORONA: 'Corona',
  CALIBRE: 'Calibre',
  CUERPO: 'Cuerpo',
  PUNTAS: 'Puntas',
  'PUNTAS Y CUERPO': 'Puntas y cuerpo',
  TEMPERATURA: 'Temperatura',
  PRESIÓN: 'Presión',
  CAUDAL: 'Caudal',
  ÁNGULO: 'Ángulo',
  ANGULO: 'Ángulo',
}

/** Datos de logística: no van a la ficha del producto. */
const LOGISTIC_LABELS = new Set([
  'PRESENTACIÓN', 'UNIDAD POR CAJA', 'UNIDAD POR BULTO', 'U. POR BULTO',
  'U. POR CAJA', 'UNIDAD MÍNIMA DE VENTA', 'ENVASE', 'IVA', 'UNID. POR BULTO',
  'UNIDAD X BULTO', 'PRECIO', 'UNIDADES POR CAJA',
])

const CODE_LABELS = new Set(['CÓDIGO', 'CODIGO'])

type Section = { label: string; values: string[]; line: number }
/** Un valor del catálogo, y si era propio de la variante o compartido. */
type SpecValue = { value: string; variant: boolean }
type SpecMap = Map<string, SpecValue>
type CatalogEntry = {
  code: string
  specs: SpecMap
  title: string
  prose: string[]
  /** La página traía una sola familia de productos: no hubo reparto posible. */
  unambiguous: boolean
}

function normalizeLabel(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toUpperCase()
}

function isLabel(line: string): boolean {
  const n = normalizeLabel(line)
  return CODE_LABELS.has(n) || LOGISTIC_LABELS.has(n) || TECH_LABELS[n] !== undefined
}

/** Parte una página en secciones etiqueta → valores, y junta el texto suelto. */
function parsePage(page: string): { sections: Section[]; prose: string[]; title: string } {
  const lines = page.split('\n').map((l) => l.trim()).filter((l) => l !== '')
  const sections: Section[] = []
  const prose: string[] = []
  let current: Section | null = null
  let title = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (isLabel(line)) {
      current = { label: normalizeLabel(line), values: [], line: i }
      sections.push(current)
      continue
    }
    if (current) {
      current.values.push(line)
      continue
    }
    // Antes de la primera etiqueta va el título de la familia y su texto.
    if (/^\d+$/.test(line)) continue // número de página
    if (title === '') title = line
    else prose.push(line)
  }
  return { sections, prose, title }
}

/**
 * Reparte las columnas de una página entre las familias de productos que hay
 * en ella. Solo asigna cuando no hay duda; si hay, deja la columna afuera.
 */
function buildEntries(page: string): CatalogEntry[] {
  const { sections, prose, title } = parsePage(page)
  const codeSections = sections.filter((s) => CODE_LABELS.has(s.label))
  if (codeSections.length === 0) return []

  // Los códigos son numéricos de 3 a 5 dígitos; el resto es ruido de la página.
  const codeLists = codeSections.map((s) => ({
    section: s,
    codes: s.values.filter((v) => /^\d{3,5}$/.test(v)),
  }))

  const techSections = sections.filter(
    (s) => !CODE_LABELS.has(s.label) && !LOGISTIC_LABELS.has(s.label) && TECH_LABELS[s.label] !== undefined,
  )

  const families = codeLists.filter((c) => c.codes.length > 0)
  if (families.length === 0) return []

  // specs[f][i] = specs del código i-ésimo de la familia f-ésima.
  const specs: SpecMap[][] = families.map((f) => f.codes.map(() => new Map()))

  const assignToFamily = (f: number, tech: Section): void => {
    const codes = families[f]?.codes ?? []
    const target = specs[f]
    if (!target) return
    if (tech.values.length === codes.length) {
      // Columna por variante: cada código tiene su propio valor. Es la única
      // clase de dato que sirve para verificar que el reparto fue correcto.
      const variant = codes.length > 1
      tech.values.forEach((v, i) => target[i]?.set(tech.label, { value: v, variant }))
    } else if (tech.values.length === 1) {
      // Valor compartido por toda la familia: no dice nada sobre la alineación.
      codes.forEach((_, i) => target[i]?.set(tech.label, { value: tech.values[0] ?? '', variant: false }))
    }
  }

  // Se resuelve etiqueta por etiqueta, porque la ambigüedad es entre las
  // columnas que comparten nombre dentro de la misma página.
  const byLabel = new Map<string, Section[]>()
  for (const t of techSections) byLabel.set(t.label, [...(byLabel.get(t.label) ?? []), t])

  for (const [, group] of byLabel) {
    // Tantas columnas como familias: van en orden de lectura, una por familia.
    if (group.length === families.length) {
      group.forEach((tech, f) => { assignToFamily(f, tech) })
      continue
    }

    // Una sola columna y una sola familia: no hay ambigüedad posible.
    if (group.length === 1 && families.length === 1) {
      assignToFamily(0, group[0] as Section)
      continue
    }

    const only = group[0]
    if (group.length === 1 && only) {
      // Un único valor idéntico para toda la página: no importa de qué familia
      // sea, el valor es el mismo para todas. Asignarlo es seguro.
      if (only.values.length === 1) {
        families.forEach((_, f) => { assignToFamily(f, only) })
        continue
      }
      // Su cantidad de valores coincide con una sola familia: es de esa.
      const candidates = families
        .map((fam, f) => ({ f, n: fam.codes.length }))
        .filter((c) => c.n === only.values.length)
      if (candidates.length === 1 && candidates[0]) {
        assignToFamily(candidates[0].f, only)
        continue
      }
    }

    // Varias columnas con el mismo nombre y todas con el mismo valor único:
    // sea cual sea el reparto, el resultado es idéntico.
    if (group.every((g) => g.values.length === 1)) {
      const distinct = new Set(group.map((g) => g.values[0]))
      const value = group[0]?.values[0]
      if (distinct.size === 1 && value !== undefined) {
        families.forEach((_, f) => {
          const codes = families[f]?.codes ?? []
          const target = specs[f]
          if (target) {
            codes.forEach((_c, i) => target[i]?.set(group[0]?.label ?? '', { value, variant: false }))
          }
        })
        continue
      }
    }

    // Cualquier otro caso: no se puede saber de quién es la columna. Se deja.
  }

  const entries: CatalogEntry[] = []
  families.forEach((fam, f) => {
    fam.codes.forEach((code, i) => {
      const s = specs[f]?.[i]
      if (!s || s.size === 0) return
      entries.push({
        code,
        specs: s,
        title,
        prose: families.length === 1 ? prose : [],
        unambiguous: families.length === 1,
      })
    })
  })
  return entries
}

// ---------------------------------------------------------------------------
// Contraste contra el nombre del propio producto
// ---------------------------------------------------------------------------

/** Normaliza una medida para poder compararla: '1/2”' y '1/2' son lo mismo. */
function normValue(v: string): string {
  return v
    .toLowerCase()
    .replace(/[”"″']/g, '')
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .trim()
}

/**
 * Igual que normValue pero conservando los espacios como separador. Es
 * necesario para el nombre: sin espacios, "Enc.3/4 19mm" se lee "3/419mm" y
 * cualquier comparación de medidas da un conflicto que no existe.
 */
function normName(v: string): string {
  return v
    .toLowerCase()
    .replace(/[”"″']/g, '')
    .replace(/,/g, '.')
    .replace(/\s+/g, ' ')
    .trim()
}

const MATERIAL_ALIASES: Record<string, string[]> = {
  'cr-v': ['crva', 'cr-v', 'crv', 'cromovanadio'],
  'cr-mo': ['crmo', 'cr-mo', 'cromomolibdeno'],
  'ac-c': ['acc', 'ac-c', 'acerocarbono'],
}

/**
 * Compara las specs del catálogo con lo que dice el nombre del producto.
 * Devuelve cuántas coinciden y cuántas se contradicen.
 */
function crossCheck(
  name: string,
  specs: SpecMap,
): { agree: number; agreeVariant: number; conflict: string[] } {
  const n = normName(name)
  let agree = 0
  let agreeVariant = 0
  const conflict: string[] = []

  /** Registra una coincidencia, distinguiendo si valida o no la alineación. */
  const ok = (label: string): void => {
    agree++
    if (specs.get(label)?.variant === true) agreeVariant++
  }
  const val = (label: string): string | undefined => specs.get(label)?.value

  // Medida en mm: el nombre suele traerla ('18mm').
  const medida = val('MEDIDA')
  if (medida !== undefined) {
    const mm = /^(\d+(?:\.\d+)?)mm$/.exec(normValue(medida))
    if (mm) {
      const num = mm[1] ?? ''
      const esc = num.replace('.', '\\.')
      // La medida puede figurar con unidad ("14 mm") o dentro de una dimensión
      // compuesta ("14 x 90 mm"), donde el número va suelto.
      const inName =
        new RegExp(`(^|[^\\d.])${esc}\\s*mm`).test(n) || new RegExp(`(^|[^\\d.])${esc}([^\\d.]|$)`).test(n)
      const otherMm = [...n.matchAll(/(\d+(?:\.\d+)?)\s*mm/g)].map((m) => m[1])
      if (inName) ok('MEDIDA')
      else if (otherMm.length > 0 && !otherMm.includes(num)) {
        conflict.push(`MEDIDA ${medida} pero el nombre dice ${otherMm.join('/')}mm`)
      }
    } else {
      // Medidas en pulgadas: '1/2', '5/16', '8”'.
      const v = normValue(medida)
      const frac = /^(\d+(?:-\d+\/\d+)?|\d+\/\d+)$/.exec(v)
      if (frac && v !== '' && n.includes(v)) ok('MEDIDA')
      else {
        // Pulgadas enteras: hay que detectar también el desacuerdo, que es
        // como se descubre una columna mal asignada.
        const whole = /^(\d+)$/.exec(v)
        if (whole) {
          const num = whole[1] ?? ''
          const inName = new RegExp(`(^|[^\\d.,/])${num}([^\\d.,/]|$)`).test(n)
          const otherInches = [...n.matchAll(/(^|[^\d.,/])(\d{1,2})(?:\s*(?:pulg|”|"))/g)].map((m) => m[2])
          if (inName) ok('MEDIDA')
          else if (otherInches.length > 0 && !otherInches.includes(num)) {
            conflict.push(`MEDIDA ${medida} pero el nombre dice ${otherInches.join('/')}”`)
          }
        }
      }
    }
  }

  // Largo: otra columna por variante, y por lo tanto otra forma de detectar
  // que una columna quedó pegada al producto equivocado.
  const largo = val('LARGO')
  if (largo !== undefined) {
    const lm = /^(\d+(?:\.\d+)?)mm$/.exec(normValue(largo))
    if (lm) {
      const num = lm[1] ?? ''
      const esc = num.replace('.', '\\.')
      const inName = new RegExp(`(^|[^\\d.])${esc}\\s*mm`).test(n)
      const otherMm = [...new Set([...n.matchAll(/(\d+(?:\.\d+)?)\s*mm/g)].map((m) => m[1]))]
      if (inName) ok('LARGO')
      else if (otherMm.length >= 2 && !otherMm.includes(num)) {
        // Con una sola medida en el nombre no se puede concluir nada: casi
        // siempre es la medida de la herramienta, no su largo, que no se
        // menciona. Recién con dos o más el nombre lista ambas y el desacuerdo
        // significa que la columna quedó pegada al producto equivocado.
        conflict.push(`LARGO ${largo} pero el nombre dice ${otherMm.join('/')}mm`)
      }
    }
  }

  // Encastre: '1/2', '3/8', '1/4'.
  const enc = val('ENCASTRE')
  if (enc !== undefined) {
    // El catálogo a veces lista varios encastres para un juego: '1/4” - 3/8” - 1/2”'.
    const catalogEncs = [...normValue(enc).matchAll(/\d\/\d/g)].map((m) => m[0])
    const encInName = /enc\.?\s*(\d\/\d)/.exec(n)?.[1]
    if (encInName !== undefined && catalogEncs.length > 0) {
      if (catalogEncs.includes(encInName)) ok('ENCASTRE')
      else conflict.push(`ENCASTRE ${enc} pero el nombre dice ${encInName}`)
    }
  }

  // Material.
  const mat = val('MATERIAL') ?? val('PUNTAS Y CUERPO')
  if (mat !== undefined) {
    const key = normValue(mat)
    const aliases = MATERIAL_ALIASES[key]
    if (aliases) {
      // Con límites de palabra: sin eso, el alias 'acc' de acero-carbono
      // matchea dentro de "Accesorios" y arma un conflicto inexistente.
      const mentions = (list: string[]): boolean =>
        list.some((a) => new RegExp(`(^|[^a-z0-9])${a}([^a-z0-9]|$)`).test(n))
      const found = mentions(aliases)
      const others = Object.entries(MATERIAL_ALIASES).filter(([k]) => k !== key)
      const contradicts = others.some(([, al]) => mentions(al))
      if (found) ok('MATERIAL')
      else if (contradicts) conflict.push(`MATERIAL ${mat} pero el nombre menciona otro material`)
    }
  }

  // Piezas: 'x 9 pzs'.
  const pz = val('PIEZAS')
  if (pz !== undefined) {
    const num = normValue(pz).replace(/\D/g, '')
    if (num !== '') {
      const inName = [...n.matchAll(/(\d+)\s*(?:pz|pzs|pza|pzas|pcs|piezas)/g)].map((m) => m[1])
      if (inName.includes(num)) ok('PIEZAS')
      else if (inName.length > 0) conflict.push(`PIEZAS ${pz} pero el nombre dice ${inName.join('/')}`)
    }
  }

  return { agree, agreeVariant, conflict }
}

// ---------------------------------------------------------------------------

type CleanProduct = {
  sku: string
  name: string
  brand: string | null
  specs: ProductSpec[]
}

type Enriched = {
  sku: string
  name: string
  codigoFabrica: string
  specs: ProductSpec[]
  description: string | null
  fuente: string
  confianza: 'confirmado' | 'sin-contraste'
  coincidencias: number
}

function main(): void {
  const pages = readFileSync(CATALOG, 'utf8').split(/<<<PAGINA \d+>>>/).slice(1)
  const catalog = new Map<string, CatalogEntry>()
  // Todos los códigos que figuran en el catálogo, tengan o no specs
  // asignables: sirve para distinguir "no está en el catálogo" de "está pero
  // no se pudo determinar qué columnas le corresponden".
  const allCodes = new Set<string>()
  for (const page of pages) {
    for (const line of page.split('\n')) {
      const v = line.trim()
      if (/^\d{3,5}$/.test(v)) allCodes.add(v)
    }
    for (const entry of buildEntries(page)) {
      // Un código puede repetirse en el índice; se queda el bloque con más datos.
      const prev = catalog.get(entry.code)
      if (!prev || prev.specs.size < entry.specs.size) catalog.set(entry.code, entry)
    }
  }

  const parsed: unknown = JSON.parse(readFileSync(PRODUCTS, 'utf8'))
  if (!Array.isArray(parsed)) throw new Error('productos-limpios.json inválido')
  const products = parsed as CleanProduct[]
  const bremen = products.filter((p) => p.brand === 'Bremen')

  const enriched: Enriched[] = []
  const sinCodigo: CleanProduct[] = []
  const sinFicha: { sku: string; name: string; code: string }[] = []
  const sinColumnas: { sku: string; name: string; code: string }[] = []
  const noVerificables: { sku: string; name: string; code: string }[] = []
  const rechazados: { sku: string; name: string; code: string; motivo: string[] }[] = []

  for (const p of bremen) {
    const code = p.specs.find((s) => s.label === 'Código de fábrica')?.value
    if (code === undefined) {
      sinCodigo.push(p)
      continue
    }
    const entry = catalog.get(code)
    if (!entry) {
      if (allCodes.has(code)) sinColumnas.push({ sku: p.sku, name: p.name, code })
      else sinFicha.push({ sku: p.sku, name: p.name, code })
      continue
    }

    const { agree, agreeVariant, conflict } = crossCheck(p.name, entry.specs)
    if (conflict.length > 0) {
      rechazados.push({ sku: p.sku, name: p.name, code, motivo: conflict })
      continue
    }
    // Si la página traía varias familias, el reparto de columnas es una
    // inferencia. Para darla por buena hace falta que coincida una columna
    // POR VARIANTE: que coincida el material no prueba nada, porque suele ser
    // el mismo en toda la página aunque la columna esté mal asignada.
    const hasVariantSpec = [...entry.specs.values()].some((s) => s.variant)
    if (!entry.unambiguous && hasVariantSpec && agreeVariant === 0) {
      noVerificables.push({ sku: p.sku, name: p.name, code })
      continue
    }
    if (!entry.unambiguous && !hasVariantSpec && agree === 0) {
      noVerificables.push({ sku: p.sku, name: p.name, code })
      continue
    }

    const specs: ProductSpec[] = [{ label: 'Código de fábrica', value: code }]
    for (const [label, spec] of entry.specs) {
      const display = TECH_LABELS[label]
      if (display !== undefined && spec.value.trim() !== '') {
        specs.push({ label: display, value: spec.value.trim() })
      }
    }

    const prose = entry.prose.filter((l) => l.length > 25 && /[a-záéíóúñ]{4}/i.test(l)).join(' ')

    enriched.push({
      sku: p.sku,
      name: p.name,
      codigoFabrica: code,
      specs,
      description: prose === '' ? null : prose,
      fuente: FUENTE,
      confianza: agree > 0 ? 'confirmado' : 'sin-contraste',
      coincidencias: agree,
    })
  }

  writeFileSync(OUT_JSON, JSON.stringify(enriched, null, 2) + '\n')

  const confirmados = enriched.filter((e) => e.confianza === 'confirmado')
  const sinContraste = enriched.filter((e) => e.confianza === 'sin-contraste')
  const conDesc = enriched.filter((e) => e.description !== null)
  const avgSpecs = enriched.length === 0 ? 0 : enriched.reduce((a, e) => a + e.specs.length - 1, 0) / enriched.length

  const report = [
    'ENRIQUECIMIENTO BREMEN — desde el catálogo oficial de la marca',
    `Fuente: ${FUENTE}`,
    '',
    `Fichas leídas del catálogo:  ${catalog.size}`,
    `Productos Bremen:            ${bremen.length}`,
    `  resueltos:                 ${enriched.length}`,
    `    confirmados por nombre:  ${confirmados.length}`,
    `    sin dato para contrastar:${sinContraste.length}`,
    `  con descripción de fábrica:${conDesc.length}`,
    `  promedio de specs:         ${avgSpecs.toFixed(1)}`,
    '',
    `NO RESUELTOS: ${sinCodigo.length + sinFicha.length + sinColumnas.length + noVerificables.length + rechazados.length}`,
    `  sin código de fábrica:     ${sinCodigo.length}`,
    `  código no está en catálogo:${sinFicha.length}`,
    `  en catálogo, columnas ambiguas: ${sinColumnas.length}`,
    `  no contrastables:          ${noVerificables.length}`,
    `  rechazados por conflicto:  ${rechazados.length}`,
    '',
    '--- RECHAZADOS: el catálogo contradice el nombre, se dejan sin specs ---',
    ...(rechazados.length === 0
      ? ['  ninguno']
      : rechazados.map((r) => `  [${r.sku}] cod ${r.code} — ${r.name}\n      ${r.motivo.join(' | ')}`)),
    '',
    '--- SIN CÓDIGO DE FÁBRICA: no hay forma de ubicarlos en el catálogo ---',
    ...(sinCodigo.length === 0 ? ['  ninguno'] : sinCodigo.map((p) => `  [${p.sku}] ${p.name}`)),
    '',
    '--- CÓDIGO AUSENTE DEL CATÁLOGO (discontinuado o de otra edición) ---',
    ...(sinFicha.length === 0 ? ['  ninguno'] : sinFicha.map((p) => `  [${p.sku}] cod ${p.code} — ${p.name}`)),
    '',
    '--- NO CONTRASTABLES: la página traía varias familias y el nombre no',
    '    aporta ningún dato para confirmar que el reparto de columnas es correcto ---',
    ...(noVerificables.length === 0
      ? ['  ninguno']
      : noVerificables.map((p) => `  [${p.sku}] cod ${p.code} — ${p.name}`)),
    '',
    '--- EN EL CATÁLOGO PERO SIN COLUMNAS ASIGNABLES SIN RIESGO ---',
    ...(sinColumnas.length === 0
      ? ['  ninguno']
      : sinColumnas.map((p) => `  [${p.sku}] cod ${p.code} — ${p.name}`)),
    '',
  ].join('\n')

  writeFileSync(OUT_REPORT, report)
  console.log(report.split('\n').slice(0, 20).join('\n'))
  console.log(`\nSpecs   → ${OUT_JSON}`)
  console.log(`Reporte → ${OUT_REPORT}`)
}

main()
