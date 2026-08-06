/**
 * Limpieza del stock real de Moreno Herramientas.
 *
 * Lee el export CSV de "STOCK MORENO HERRMIENTAS.xlsx" y genera un archivo
 * JSON con los productos listos para insertar en la DB. NO toca la base:
 * el archivo que se genera acá es exactamente el que después consume el
 * importador, así que lo que se verifica es lo que se sube.
 *
 *   npx tsx scripts/clean-stock.ts data/stock-raw.csv
 *
 * Genera:
 *   data/productos-limpios.json  → productos listos para insertar
 *   data/reporte-limpieza.txt    → resumen + casos que hay que mirar a mano
 *
 * Reglas aplicadas (acordadas con el cliente):
 *   - Solo productos con Existencia > 0.
 *   - El precio publicado es P. Venta. P. Costo NUNCA se publica: viene
 *     embebido en el nombre como "/12345/" y se descarta.
 *   - Los códigos salen del título; los de fábrica/modelo van a specs.
 *   - Notas internas fuera del título.
 *   - Title Case respetando unidades, fracciones y capitalización de marca.
 *   - Todo entra a "sin-categorizar"; la categorización real es un paso aparte.
 *   - Margen <= 0 entra con active: false (no se vende a pérdida sin revisar).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { slugify } from '@/lib/utils/slug'
import { UNCATEGORIZED_SLUG } from '@/lib/catalog/categorization'
import type { ProductSpec } from '@/lib/db/schemas/products'

type RawRow = {
  codigo: string
  producto: string
  costo: string
  venta: string
  mayoreo: string
  depto: string
  exist: string
  invMin: string
  invMax: string
  tipo: string
  proveedor: string
}

type CleanProduct = {
  sku: string
  slug: string
  name: string
  price: number // centavos
  stock: number
  brand: string | null
  active: boolean
  specs: ProductSpec[]
  categorySlug: string
}

type Skipped = { codigo: string; producto: string; motivo: string }

const OUT_JSON = 'data/productos-limpios.json'
const OUT_CSV = 'data/productos-limpios.csv'
const OUT_REPORT = 'data/reporte-limpieza.txt'

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/** Parser CSV con soporte de comillas y saltos de línea dentro del campo. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** "$1.234,56" → 123456 centavos. Devuelve null si no parsea. */
function parseMoney(value: string): number | null {
  const cleaned = value.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? Math.round(n * 100) : null
}

// ---------------------------------------------------------------------------
// Marcas — capitalización propia de cada una
// ---------------------------------------------------------------------------

/** Marcas que se escriben distinto de un Title Case ingenuo. */
const BRAND_CANONICAL: Record<string, string> = {
  BOSCH: 'Bosch',
  DEWALT: 'DeWALT',
  STANLEY: 'Stanley',
  BREMEN: 'Bremen',
  EUROTECH: 'Eurotech',
  RUTMANN: 'Rutmann',
  RUHLMANN: 'Ruhlmann',
  LUSQTOFF: 'Lusqtoff',
  'PZ FORCE': 'PZ Force',
  'PZ FORCE NACIONAL': 'PZ Force Nacional',
  'GD TOOLS': 'GD Tools',
  DAVIDSON: 'Davidson',
  RUCCI: 'Rucci',
  OMAHA: 'Omaha',
  DORREGO: 'Dorrego',
  GAMMA: 'Gamma',
  EMTOP: 'EMTOP',
  SILOC: 'Siloc',
  WADFOW: 'WADFOW',
  INGCO: 'INGCO',
  CROSSMASTER: 'Crossmaster',
  '3M': '3M',
  BEMAR: 'Bemar',
  WEMBLEY: 'Wembley',
  ARGENTEC: 'Argentec',
  LLUSA: 'Llusa',
  EZETA: 'Ezeta',
  CAT: 'CAT',
  RICO: 'Rico',
  SIDERAL: 'Sideral',
  TRABASIL: 'Trabasil',
  DACALOR: 'Dacalor',
  CANDAMIO: 'Candamio',
  PALLADINO: 'Palladino',
  'DELFABRO IMP': 'Delfabro',
  DELFABRO: 'Delfabro',
  MAER: 'Maer',
  TOTAL: 'Total',
  GUILLER: 'Guiller',
  VESUBIO: 'Vesubio',
  PEDERCINI: 'Pedercini',
  AUTEL: 'Autel',
  SIKA: 'Sika',
  'DOWEN PAGIO': 'Dowen Pagio',
  LOCTITE: 'Loctite',
  DELHI: 'Delhi',
  KLD: 'KLD',
  SOLA: 'Sola',
  'LEADER-ART': 'Leader Art',
  LEADER: 'Leader',
  ALNAT: 'Alnat',
  ERREVE: 'Erreve',
  EINHELL: 'Einhell',
  LAUNCH: 'Launch',
  CORLU: 'Corlu',
  CIANO: 'Ciano',
  AUTOPOLISH: 'Autopolish',
  TYROLIT: 'Tyrolit',
  THUNDER: 'Thunder',
  KONAN: 'Konan',
  ENERGIZER: 'Energizer',
  MOTORMECH: 'Motormech',
  RASELLI: 'Raselli',
  TRIPLEC: 'Triple C',
  KWB: 'KWB',
  PERMATEX: 'Permatex',
  'BAHCO ARGENTINA': 'Bahco Argentina',
  BAHCO: 'Bahco',
  'LUSQTOFF-TRUPER': 'Lusqtoff Truper',
  TRUPER: 'Truper',
  PEGAMIL: 'Pegamil',
  SICA: 'Sica',
  'BROK TOOLS': 'Brok Tools',
  PENETRIT: 'Penetrit',
  SILEX: 'Silex',
  OREBRO: 'Orebro',
  GLADIATOR: 'Gladiator',
  FNIRSI: 'FNIRSI',
  ILLINOIS: 'Illinois',
  ANNOVI: 'Annovi',
  'PATAGONIA TOOLS': 'Patagonia Tools',
  PASQUINELLI: 'Pasquinelli',
  SERVITEC: 'Servitec',
  DISTRIMAR: 'Distrimar',
}

/** Valores de Departamento que no son una marca — el producto queda sin marca. */
const NOT_A_BRAND = new Set([
  '- SIN DEPARTAMENTO -',
  'IMPORTADOS',
  'ELECTRO',
  'MH',
  'RR',
  'FS',
  'CHI',
  'MB',
  'TS',
  'PZ',
  'UNIT',
  'TMLH',
  'F347',
  'TF3',
  'W80',
  'L80',
])

function canonicalBrand(raw: string): string | null {
  const key = raw.trim().toUpperCase()
  if (key === '' || NOT_A_BRAND.has(key)) return null
  const known = BRAND_CANONICAL[key]
  if (known !== undefined) return known
  return titleCase(raw)
}

/** Set de marcas para reconocerlas dentro del nombre del producto. */
const BRAND_TOKENS = new Map<string, string>(
  Object.entries(BRAND_CANONICAL).filter(([k]) => !k.includes(' ')),
)

// ---------------------------------------------------------------------------
// Title Case
// ---------------------------------------------------------------------------

/** Conectores que van en minúscula salvo al principio del nombre. */
const LOWERCASE_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'y', 'o', 'con', 'para',
  'por', 'en', 'a', 'al', 'sin', 'the',
])

/** Unidades: la clave es la unidad en minúscula, el valor cómo se escribe. */
const UNITS: Record<string, string> = {
  mm: 'mm', cm: 'cm', m: 'm', mt: 'mt', mts: 'mts', km: 'km',
  ml: 'ml', l: 'L', lt: 'lt', lts: 'lts', cc: 'cc',
  kg: 'kg', g: 'g', gr: 'gr', mg: 'mg', tn: 'Tn', ton: 'Ton',
  w: 'W', kw: 'kW', v: 'V', kv: 'kV', a: 'A', ah: 'Ah', mah: 'mAh',
  hp: 'Hp', cv: 'CV', nm: 'Nm', rpm: 'rpm', bar: 'bar', psi: 'psi',
  db: 'dB', hz: 'Hz', khz: 'kHz', lm: 'lm', k: 'K',
  pulg: 'pulg', pz: 'pz', pzs: 'pzs', pcs: 'pcs', pc: 'pc', u: 'U', unid: 'unid',
}

/**
 * Unidades que también se reconocen sueltas ("13 MM", "18 Kg").
 * Quedan afuera las de una letra que en español son palabra: "a" (preposición),
 * "l", "g", "u" — solo se normalizan pegadas al número ("12a", "500g").
 */
const STANDALONE_UNITS = new Set([
  'mm', 'cm', 'm', 'mt', 'mts', 'km', 'ml', 'lt', 'lts', 'cc', 'kg', 'gr',
  'w', 'kw', 'v', 'kv', 'hp', 'cv', 'nm', 'rpm', 'bar', 'psi', 'hz', 'db',
  'pulg', 'pz', 'pzs', 'pcs', 'tn', 'ton',
])

/** Siglas técnicas que no se tocan. */
const ACRONYMS: Record<string, string> = {
  CRVA: 'CrVa', CRMO: 'CrMo', SDS: 'SDS', HSS: 'HSS', TPR: 'TPR', ABS: 'ABS',
  LED: 'LED', USB: 'USB', MIG: 'MIG', TIG: 'TIG', PVC: 'PVC', INOX: 'Inox',
  SAE: 'SAE', NPT: 'NPT', BSP: 'BSP', DIN: 'DIN', ISO: 'ISO', VHB: 'VHB',
  PU: 'PU', PET: 'PET', EVA: 'EVA', AC: 'AC', DC: 'DC', XL: 'XL',
  UV: 'UV', PH: 'PH', TX: 'TX', OK: 'OK',
}

/** Palabra sin signos de puntuación en los extremos. */
function coreOf(token: string): { pre: string; core: string; post: string } {
  const m = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(token)
  return { pre: m?.[1] ?? '', core: m?.[2] ?? token, post: m?.[3] ?? '' }
}

function capitalize(word: string): string {
  if (word === '') return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/** Title Case de una palabra suelta, respetando unidades, siglas y marcas. */
function titleCaseWord(
  token: string,
  isFirst: boolean,
  neighbours?: { prev: string; next: string },
  preserveShortCaps = false,
): string {
  const { pre, core, post } = coreOf(token)
  if (core === '') return token

  const upper = core.toUpperCase()

  // Unidad suelta: "13 MM" → "13 mm", "x 7 Pcs." → "x 7 pcs.", "(Mm)" → "(mm)".
  // Las de una sola letra (m, w, v) solo se normalizan si tocan un número,
  // porque sueltas pueden ser cualquier otra cosa.
  const asUnit = UNITS[core.toLowerCase()]
  if (asUnit !== undefined && STANDALONE_UNITS.has(core.toLowerCase())) {
    const touchesNumber =
      neighbours !== undefined && (/\d$/.test(neighbours.prev) || /^\d/.test(neighbours.next))
    if (core.length > 1 || touchesNumber) return pre + asUnit + post
  }

  // Sigla corta en un nombre que no está todo en mayúsculas: "Arrestallama HB".
  if (
    preserveShortCaps &&
    core === upper &&
    core.length <= 2 &&
    /^\p{Lu}+$/u.test(core) &&
    !LOWERCASE_WORDS.has(core.toLowerCase())
  ) {
    return pre + upper + post
  }

  // Marca conocida → capitalización propia de la marca.
  const brand = BRAND_TOKENS.get(upper)
  if (brand !== undefined) return pre + brand + post

  // Sigla técnica.
  const acronym = ACRONYMS[upper]
  if (acronym !== undefined) return pre + acronym + post

  // "x" multiplicador: "Puntas x 4", "Precintos X 100".
  if (core.toLowerCase() === 'x') return pre + 'x' + post

  // Tokens con dígitos: son medidas o referencias de fábrica. Se respeta la
  // grafía del origen (GSS23AE, T144D, RML850-7) y solo se normaliza la
  // unidad pegada al número: 180MM → 180mm, 2200w → 2200W. Con más de cinco
  // dígitos ya no es una medida sino un código ("670483M"), y no se toca.
  if (/\d/.test(core)) {
    const normalized = core.replace(
      /(\d+)([a-záéíóúñ]+)/gi,
      (match, digits: string, letters: string) => {
        if (digits.length > 5) return match
        const unit = UNITS[letters.toLowerCase()]
        return unit === undefined ? match : digits + unit
      },
    )
    return pre + normalized + post
  }

  // Conector en minúscula, salvo si abre el nombre.
  if (!isFirst && LOWERCASE_WORDS.has(core.toLowerCase())) {
    return pre + core.toLowerCase() + post
  }

  return pre + capitalize(core) + post
}

function titleCase(text: string): string {
  const tokens = text.split(' ')
  // Un nombre íntegramente en mayúsculas no distingue siglas del resto, así que
  // ahí no se conserva ninguna: se normaliza todo.
  const preserveShortCaps = text !== text.toUpperCase()

  return tokens
    .map((t, i) => {
      const prev = tokens[i - 1] ?? ''
      const next = tokens[i + 1] ?? ''
      const neighbours = { prev: coreOf(prev).core, next: coreOf(next).core }

      // Palabras unidas por guion, barra o punto se capitalizan por parte.
      if (!/\d/.test(t) && /[-/.]/.test(t) && /\p{L}/u.test(t)) {
        const parts = t.split(/([-/.])/)
        return parts
          .map((part, j) => {
            if (/^[-/.]$/.test(part)) return part
            // Dentro del token, el vecino relevante es la parte de al lado.
            const inner = {
              prev: coreOf(parts[j - 1] ?? '').core || neighbours.prev,
              next: coreOf(parts[j + 1] ?? '').core || neighbours.next,
            }
            return titleCaseWord(part, i === 0 && j === 0, inner, preserveShortCaps)
          })
          .join('')
      }
      return titleCaseWord(t, i === 0, neighbours, preserveShortCaps)
    })
    .join(' ')
}

// ---------------------------------------------------------------------------
// Limpieza del nombre
// ---------------------------------------------------------------------------

/** Nota interna del cliente: recargo por origen. Nunca se publica. */
const INTERNAL_NOTE = /\(?\s*ATENCI[OÓ]N\s+TAIWAN\s*\+?\s*\$?\s*[\d.]*\s*\)?/gi
/** Recordatorio del cliente para no reponer el producto. No es del comprador. */
const DELIST_NOTE = /\bCUANDO\s+SE\s+VENDA\s+ELIMINARLO\s+DE\s+LA\s+LISTA\b/gi
/** Aclaración de que el precio es unitario aunque el envase traiga varias. */
const PER_UNIT_NOTE = /\bPRECIO\s+POR\s+UNIDAD\b/gi
/** Cantidad del envase (solo se saca cuando el producto se vende suelto). */
const PACK_QTY = /\b\d+\s*(?:pz|pzs|pcs|u|unid)\b\.?/gi

/**
 * Token inicial que es un código y no parte del nombre comercial.
 * Devuelve el código y el nombre sin él, o null si el token no es un código.
 */
type LeadingCode = { code: string; rest: string; kind: 'interno' | 'fabrica' }

function splitLeadingCode(name: string, codigo: string): LeadingCode | null {
  const trimmed = name.trim()
  if (trimmed === '') return null

  /** El resto tiene que seguir siendo un nombre, no dos letras sueltas. */
  const isUsableRest = (rest: string): boolean =>
    rest !== '' && /(^|\s)\p{L}{3,}/u.test(rest)

  // Código pegado a la palabra siguiente: "4141Precintos" → "4141" + "Precintos".
  const glued = /^(\d{3,})([\p{Lu}][\p{L}]{2,}.*)$/u.exec(trimmed)
  if (glued) {
    const rest = (glued[2] ?? '').trim()
    if (isUsableRest(rest)) return { code: glued[1] ?? '', rest, kind: 'fabrica' }
  }

  const spaceAt = trimmed.indexOf(' ')
  if (spaceAt < 0) return null
  const token = trimmed.slice(0, spaceAt)
  const rest = trimmed.slice(spaceAt + 1).trim()
  if (!isUsableRest(rest)) return null

  const { core } = coreOf(token)
  if (core === '') return null
  const upper = core.toUpperCase()

  // El código de la fila, aunque parezca una medida ("250W Soldador 250W
  // Tubular", código 250W). Ya vive en sku, así que no se guarda en specs.
  if (upper === codigo.trim().toUpperCase()) return { code: token, rest, kind: 'interno' }

  // Nunca tratar una marca como código: "3M Cinta Aislante".
  if (BRAND_TOKENS.has(upper)) return null
  // Ni una medida: "8mm Llave ...", "1/2 Tubo ...". Con más de cinco dígitos
  // ya no es una medida sino una referencia ("670483M").
  const unitMatch = /^([\d]+(?:[.,][\d]+)?)([a-záéíóúñ]+)$/i.exec(core)
  if (
    unitMatch &&
    (unitMatch[1] ?? '').replace(/\D/g, '').length <= 5 &&
    UNITS[(unitMatch[2] ?? '').toLowerCase()] !== undefined
  ) {
    return null
  }
  // Fracciones y dimensiones ("1/2", "8x9"). Los decimales quedan afuera a
  // propósito: "176,3" es un código, no una medida.
  if (/^[\d]+([/x×][\d]+)+$/i.test(core)) return null

  // Correlativo interno del cliente: "13 Tubo Sonda Lambda", "62 Llave para...".
  // No se guarda: no le dice nada a nadie fuera del mostrador. Se respeta si
  // es una cantidad ("4 pcs Vag 1.2").
  if (/^\d{1,2}$/.test(core)) {
    const nextWord = coreOf(rest.split(' ')[0] ?? '').core.toLowerCase()
    if (STANDALONE_UNITS.has(nextWord) || UNITS[nextWord] !== undefined) return null
    return { code: token, rest, kind: 'interno' }
  }

  // Referencia alfanumérica de fábrica: G216AR, DWA281150, 11-921A, LIL260-9BK.
  if (/^[A-Z]{1,8}[-.]?\d{2,}[A-Z0-9\-.]*$/i.test(core)) return { code: token, rest, kind: 'fabrica' }
  // Referencia que arranca con dígitos: 66119LA, 1014D, 140i, 2155X.
  if (/^\d{3,}[A-Z]{1,3}\d*$/i.test(core)) return { code: token, rest, kind: 'fabrica' }
  // Referencia con punto: 471.CDS-52, 034.ET-5, 507.TF-800.
  if (/^\d{2,4}\.[A-Z0-9][A-Z0-9.\-]*$/i.test(core)) return { code: token, rest, kind: 'fabrica' }
  // Código numérico: 67049, 300060, 2608690554, 176,3.
  if (/^\d{3,}$/.test(core)) return { code: token, rest, kind: 'fabrica' }
  if (/^\d+[.,]\d+$/.test(core) && core.replace(/\D/g, '').length >= 3) {
    return { code: token, rest, kind: 'fabrica' }
  }
  // Código con guion: 001-17, 10-09628-107.
  if (/^\d{2,}-[\dA-Z-]+$/i.test(core)) return { code: token, rest, kind: 'fabrica' }

  return null
}

type NameResult = { name: string; factoryCode: string | null; notes: string[] }

function cleanName(rawName: string, codigo: string, costoCents: number | null): NameResult {
  const notes: string[] = []
  let name = rawName

  // Espacios raros (nbsp, espacios finos) → espacio común.
  name = name.replace(/[    ]/g, ' ')

  // El precio de costo embebido: "/12345/". Nunca se publica. Va SIEMPRE al
  // final, y hay que anclarlo ahí: buscarlo suelto rompe los nombres que
  // terminan en fracción ("Enc 1/2/6999/" perdería el 2 y dejaría el 6999).
  name = name.replace(/\/\s*\d+\/+\s*$/, ' ')

  // A veces falta la barra de cierre ("Rodilleras/157875"). Sin ella no se
  // distingue de una fracción, así que solo se saca si el número es
  // exactamente el P. Costo de la fila.
  if (costoCents !== null && costoCents > 0) {
    const pesos = String(Math.round(costoCents / 100))
    name = name.replace(new RegExp(`/\\s*${pesos}\\s*$`), ' ')
  }

  // Notas internas.
  if (INTERNAL_NOTE.test(name)) {
    notes.push('nota interna de recargo (ATENCION TAIWAN) removida')
    name = name.replace(INTERNAL_NOTE, ' ')
  }
  INTERNAL_NOTE.lastIndex = 0

  if (DELIST_NOTE.test(name)) {
    notes.push('recordatorio interno "cuando se venda eliminarlo de la lista" removido')
    name = name.replace(DELIST_NOTE, ' ')
  }
  DELIST_NOTE.lastIndex = 0

  // "PRECIO POR UNIDAD": el envase trae varias pero se vende suelta, así que
  // también se saca la cantidad del envase para que el título no engañe.
  if (PER_UNIT_NOTE.test(name)) {
    notes.push('aclaración "precio por unidad" y cantidad de envase removidas')
    name = name.replace(PER_UNIT_NOTE, ' ').replace(PACK_QTY, ' ')
  }
  PER_UNIT_NOTE.lastIndex = 0

  name = name.replace(/\s+/g, ' ').trim()

  // Códigos al principio del título. Solo el de fábrica se conserva: el
  // interno ya está en sku o no le sirve a nadie fuera del mostrador.
  // Puede haber más de uno encadenado: el código del cliente viene partido en
  // dos tokens ("2155X 350 Destornillador", código "2155 X 350").
  let factoryCode: string | null = null
  for (let i = 0; i < 2; i++) {
    const split = splitLeadingCode(name, codigo)
    if (!split) break
    name = split.rest
    if (split.kind === 'fabrica' && factoryCode === null) factoryCode = coreOf(split.code).core
  }

  // Basura de puntuación que queda en los extremos.
  name = name
    .replace(/^[\s\-–—:.,;/]+/, '')
    .replace(/[\s\-–—:.,;]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()

  return { name: titleCase(name), factoryCode, notes }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const filePath = process.argv[2] ?? 'data/stock-raw.csv'
  const rows = parseCsv(readFileSync(filePath, 'utf8'))
  const [, ...dataRows] = rows

  type Draft = {
    sku: string
    name: string
    factoryCode: string | null
    price: number
    stock: number
    brand: string | null
    active: boolean
  }

  const drafts: Draft[] = []
  const skipped: Skipped[] = []
  const noted: { sku: string; name: string; notes: string[] }[] = []
  const inactive: { sku: string; name: string; costo: string; venta: string }[] = []
  const recovered: { sku: string; name: string }[] = []
  const seenSkus = new Set<string>()

  let totalRows = 0
  let sinStock = 0

  for (const cells of dataRows) {
    totalRows++
    const row: RawRow = {
      codigo: (cells[0] ?? '').trim(),
      producto: cells[1] ?? '',
      costo: (cells[2] ?? '').trim(),
      venta: (cells[3] ?? '').trim(),
      mayoreo: (cells[4] ?? '').trim(),
      depto: (cells[5] ?? '').trim(),
      exist: (cells[6] ?? '').trim(),
      invMin: (cells[7] ?? '').trim(),
      invMax: (cells[8] ?? '').trim(),
      tipo: (cells[9] ?? '').trim(),
      proveedor: (cells[10] ?? '').trim(),
    }

    // Solo lo que tiene stock real.
    if (!/^\d+$/.test(row.exist)) {
      sinStock++
      continue
    }
    const stock = Number(row.exist)
    if (stock <= 0) {
      sinStock++
      continue
    }

    if (row.codigo === '') {
      skipped.push({ codigo: '(vacío)', producto: row.producto, motivo: 'sin código' })
      continue
    }
    if (seenSkus.has(row.codigo.toUpperCase())) {
      skipped.push({ codigo: row.codigo, producto: row.producto, motivo: 'código duplicado' })
      continue
    }

    const price = parseMoney(row.venta)
    if (price === null || price <= 0) {
      skipped.push({ codigo: row.codigo, producto: row.producto, motivo: `precio de venta inválido (${row.venta})` })
      continue
    }

    const costo = parseMoney(row.costo)
    const { name, factoryCode, notes } = cleanName(row.producto, row.codigo, costo)
    // Sin letras no hay nombre de producto: la fila trae solo un código.
    if (!/\p{L}/u.test(name)) {
      skipped.push({ codigo: row.codigo, producto: row.producto, motivo: 'la fila no tiene nombre, solo un código' })
      continue
    }

    // Margen <= 0 → no se publica hasta que el cliente confirme el precio.
    const active = !(costo !== null && costo > 0 && price <= costo)
    if (!active) inactive.push({ sku: row.codigo, name, costo: row.costo, venta: row.venta })

    seenSkus.add(row.codigo.toUpperCase())
    if (notes.length > 0) noted.push({ sku: row.codigo, name, notes })

    drafts.push({
      sku: row.codigo,
      name,
      factoryCode,
      price,
      stock,
      brand: canonicalBrand(row.depto),
      active,
    })
  }

  // Segunda pasada: cuando dos productos distintos quedaron con el mismo
  // nombre, el código de fábrica era lo único que los diferenciaba (las hojas
  // de calar T144D/T244D/T344D son tres productos, no uno). En ese caso vuelve
  // al título; si no hay código, quedan duplicados y se reportan.
  const byName = new Map<string, Draft[]>()
  for (const d of drafts) {
    const key = d.name.toLowerCase()
    byName.set(key, [...(byName.get(key) ?? []), d])
  }
  for (const group of byName.values()) {
    if (group.length < 2) continue
    // Los códigos del grupo tienen que ser distintos entre sí, y un número
    // corto es un correlativo interno del cliente (158, 169), no una
    // referencia de fábrica: agregarlo al título no le dice nada al comprador.
    const codes = group.map((d) => d.factoryCode)
    const usable = codes.every((c) => c !== null && (/[A-Z]/i.test(c) || c.replace(/\D/g, '').length >= 6))
    if (!usable || new Set(codes).size !== codes.length) continue
    for (const d of group) {
      if (d.factoryCode === null) continue
      d.name = `${d.name} ${d.factoryCode}`
      recovered.push({ sku: d.sku, name: d.name })
    }
  }

  const products: CleanProduct[] = []
  const usedSlugs = new Set<string>()
  const nameCount = new Map<string, string[]>()

  for (const d of drafts) {
    let slug = slugify(d.name)
    if (usedSlugs.has(slug)) slug = `${slug}-${slugify(d.sku)}`
    usedSlugs.add(slug)

    const key = d.name.toLowerCase()
    nameCount.set(key, [...(nameCount.get(key) ?? []), d.sku])

    const specs: ProductSpec[] = []
    if (d.factoryCode !== null) specs.push({ label: 'Código de fábrica', value: d.factoryCode })

    products.push({
      sku: d.sku,
      slug,
      name: d.name,
      price: d.price,
      stock: d.stock,
      brand: d.brand,
      active: d.active,
      specs,
      categorySlug: UNCATEGORIZED_SLUG,
    })
  }

  writeFileSync(OUT_JSON, JSON.stringify(products, null, 2) + '\n')

  // Mismo contenido en CSV, para revisarlo en Excel antes de subir nada.
  const csvCell = (v: string): string => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const csv = [
    ['sku', 'name', 'slug', 'precio', 'precio_centavos', 'stock', 'marca', 'activo', 'codigo_fabrica'].join(','),
    ...products.map((p) =>
      [
        csvCell(p.sku),
        csvCell(p.name),
        csvCell(p.slug),
        csvCell((p.price / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })),
        String(p.price),
        String(p.stock),
        csvCell(p.brand ?? ''),
        p.active ? 'si' : 'NO',
        csvCell(p.specs[0]?.value ?? ''),
      ].join(','),
    ),
  ].join('\n')
  writeFileSync(OUT_CSV, csv + '\n')

  const duplicateNames = [...nameCount.entries()].filter(([, skus]) => skus.length > 1)
  const withFactoryCode = products.filter((p) => p.specs.length > 0).length
  const withoutBrand = products.filter((p) => p.brand === null).length

  const report = [
    'LIMPIEZA DEL STOCK — MORENO HERRAMIENTAS',
    `Origen: ${filePath}`,
    '',
    `Filas leídas:            ${totalRows}`,
    `Descartadas sin stock:   ${sinStock}`,
    `Descartadas con error:   ${skipped.length}`,
    `PRODUCTOS LISTOS:        ${products.length}`,
    '',
    `  con código de fábrica en specs: ${withFactoryCode}`,
    `  sin marca:                      ${withoutBrand}`,
    `  inactivos (margen <= 0):        ${inactive.length}`,
    '',
    '--- DESCARTADOS (revisar a mano) ---',
    ...(skipped.length === 0
      ? ['  ninguno']
      : skipped.map((s) => `  [${s.codigo}] ${s.motivo}\n      ${s.producto}`)),
    '',
    '--- INACTIVOS: margen <= 0, no se publican hasta confirmar precio ---',
    ...(inactive.length === 0
      ? ['  ninguno']
      : inactive.map((p) => `  [${p.sku}] costo ${p.costo} / venta ${p.venta}\n      ${p.name}`)),
    '',
    '--- CÓDIGO DEVUELTO AL TÍTULO (era lo único que los diferenciaba) ---',
    ...(recovered.length === 0
      ? ['  ninguno']
      : recovered.map((r) => `  [${r.sku}] ${r.name}`)),
    '',
    '--- NOMBRES DUPLICADOS (slug desambiguado con el sku) ---',
    ...(duplicateNames.length === 0
      ? ['  ninguno']
      : duplicateNames.map(([name, skus]) => `  ${skus.join(', ')}\n      ${name}`)),
    '',
    '--- NOTAS REMOVIDAS DEL TÍTULO ---',
    ...(noted.length === 0
      ? ['  ninguna']
      : noted.map((n) => `  [${n.sku}] ${n.notes.join(' | ')}\n      ${n.name}`)),
    '',
  ].join('\n')

  writeFileSync(OUT_REPORT, report)
  console.log(report)
  console.log(`\nProductos → ${OUT_JSON}`)
  console.log(`Revisión  → ${OUT_CSV}`)
  console.log(`Reporte   → ${OUT_REPORT}`)
}

main()
