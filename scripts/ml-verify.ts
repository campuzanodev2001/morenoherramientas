/**
 * Decide si una ficha de MercadoLibre es del mismo producto que uno nuestro,
 * cuando NO hay código de barras que cruzar.
 *
 * No es un script ejecutable: lo usa scripts/ml-match-names.ts.
 *
 * ── Por qué esto existe y por qué es tan desconfiado ───────────────────────
 *
 * El cruce por EAN prueba identidad: el GTIN de la ficha es el SKU, listo. Los
 * 975 productos que quedaron sin foto no tienen esa prueba —o su EAN no está
 * en el catálogo de ML—, así que lo único disponible es el nombre. Y un match
 * por nombre plausible pero equivocado es peor que no tener foto: el comprador
 * ve una herramienta y recibe otra, y nadie lo audita después.
 *
 * Es la misma trampa del catálogo Bremen (ver CLAUDE.md), así que se aplica la
 * misma regla: **solo una dimensión discriminante valida el emparejamiento**.
 * Que coincida la marca no prueba nada —Bremen tiene 486 productos— y que
 * coincida el material tampoco. Lo que prueba es la medida, el encastre, la
 * potencia: lo que distingue a un producto de sus hermanos de la misma familia.
 *
 * Un candidato tiene que pasar las cinco:
 *
 *   1. MARCA        — igual a la nuestra (con contención, ver normalizeBrand).
 *   2. TIPO         — el sustantivo principal de nuestro nombre aparece en el
 *                     de ML. Una "Llave" no puede matchear con una "Pinza".
 *   3. JUEGO        — o los dos son un juego/set/kit, o ninguno. Un juego de
 *                     llaves contiene la medida 14 y comparte dimensión con la
 *                     llave suelta de 14: sin esta regla, matchean.
 *   4. EVIDENCIA    — al menos una dimensión del nombre coincide, o el modelo
 *                     de fábrica de la ficha aparece en nuestro nombre.
 *   5. SIN CONTRADICCIÓN — ninguna dimensión presente en ambos nombres puede
 *                     tener valores disjuntos. Nuestro 14 mm contra su 16 mm
 *                     descarta el candidato entero.
 *
 * Y una sexta, que se aplica afuera (ml-match-names.ts): si más de una ficha
 * distinta pasa las cinco, el producto queda sin foto por ambiguo. No se elige.
 *
 * ── De dónde se sacan las dimensiones ──────────────────────────────────────
 *
 * SOLO del nombre, en los dos lados. Los atributos de la ficha de ML tientan
 * porque vienen estructurados, pero traen largos de empaque y medidas de
 * embalaje en las mismas unidades que la medida del producto: meter eso en la
 * detección de contradicciones hace que una llave de 14 mm choque contra el
 * "largo 300 mm" de su propia ficha y se descarte sola. El nombre lo curan los
 * dos lados y es lo que efectivamente identifica al producto.
 */

/** Familias de dimensión que sabemos leer de un nombre. */
export type DimensionKind =
  | 'compuesta'
  | 'mm'
  | 'cm'
  | 'metros'
  | 'pulgada'
  | 'fraccion'
  | 'encastre'
  | 'watts'
  | 'hp'
  | 'litros'
  | 'voltaje'
  | 'amperaje'
  | 'piezas'
  | 'unidades'
  | 'rosca'
  | 'rpm'
  | 'kg'
  | 'toneladas'
  | 'dientes'
  | 'torx'
  | 'punta_medida'

export type Dimensions = Map<DimensionKind, Set<string>>

/** Saca acentos y pasa a minúscula para poder comparar. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Deja la marca comparable: sin acentos, sin espacios ni guiones, minúscula.
 * Misma función que usa ml-fetch.ts para el cruce por EAN.
 */
export function normalizeBrand(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, '')
}

/**
 * "11.50" y "11,50" son el mismo número; "1.00" y "1" también. Sin esto, la
 * mitad de las mechas HSS no coincidirían consigo mismas.
 */
function normalizeNumber(raw: string): string {
  const parsed = Number.parseFloat(raw.replace(',', '.'))
  return Number.isFinite(parsed) ? String(parsed) : raw
}

/** "1 / 2" y "1/2" son la misma fracción. */
function normalizeFraction(raw: string): string {
  return raw.replace(/\s+/g, '')
}

type Pattern = {
  kind: DimensionKind
  re: RegExp
  normalize: (raw: string) => string
}

/**
 * El orden importa poco porque cada patrón se ancla a su propia unidad, pero
 * los anclajes sí: `\b` antes de la unidad evita que "210mm" se lea como la
 * rosca "m10", y el lookbehind de `fraccion` evita partir "11/2" en dos.
 */
const PATTERNS: readonly Pattern[] = [
  // "3.6x200mm" es una sola medida, no un 200 suelto. Leerla entera es lo que
  // separa un precinto de otro dentro de la misma familia.
  {
    kind: 'compuesta',
    re: /(\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?)\s*(?:m\.?m|c\.?m)?\b/g,
    normalize: (raw) =>
      raw
        .split(/[x×]/)
        .map((part) => normalizeNumber(part.trim()))
        .join('x'),
  },
  { kind: 'mm', re: /(\d+(?:[.,]\d+)?)\s*m\.?m\b/g, normalize: normalizeNumber },
  { kind: 'cm', re: /(\d+(?:[.,]\d+)?)\s*c\.?m\b/g, normalize: normalizeNumber },
  // "8mtrs", "9m", "10 mts": el catálogo del cliente y ML lo escriben de todas
  // las formas posibles y sin esto no se detecta que difieren.
  {
    kind: 'metros',
    re: /(\d+(?:[.,]\d+)?)\s*(?:mtrs|mtr|mts|metros|metro|m)\b/g,
    normalize: normalizeNumber,
  },
  {
    kind: 'pulgada',
    re: /(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*(?:"|''|”|pulg\w*)/g,
    normalize: (raw) => (raw.includes('/') ? normalizeFraction(raw) : normalizeNumber(raw)),
  },
  { kind: 'encastre', re: /\benc\.?\s*(\d+\s*\/\s*\d+)/g, normalize: normalizeFraction },
  // Fracción suelta: "Llave Tubo 1/2" sin comilla ni "Enc". Es la forma más
  // común de escribir el encastre en el catálogo del cliente.
  {
    kind: 'fraccion',
    re: /(?<![\d.,/])(\d{1,2}\s*\/\s*\d{1,2})(?![\d/])/g,
    normalize: normalizeFraction,
  },
  { kind: 'watts', re: /(\d+(?:[.,]\d+)?)\s*w(?:atts?)?\b/g, normalize: normalizeNumber },
  { kind: 'hp', re: /(\d+(?:[.,]\d+)?)\s*hp\b/g, normalize: normalizeNumber },
  { kind: 'litros', re: /(\d+(?:[.,]\d+)?)\s*(?:lts?|litros?)\b/g, normalize: normalizeNumber },
  { kind: 'voltaje', re: /(\d+(?:[.,]\d+)?)\s*v(?:olts?)?\b/g, normalize: normalizeNumber },
  { kind: 'amperaje', re: /(\d+(?:[.,]\d+)?)\s*am?p\w*\b/g, normalize: normalizeNumber },
  { kind: 'piezas', re: /(\d+)\s*(?:pz|pzs|pzas?|pcs?|piezas?)\b/g, normalize: normalizeNumber },
  // "10und" en el título de ML es un pack de diez. Sin leerlo, un cincel suelto
  // matchea con la caja de diez cinceles.
  {
    kind: 'unidades',
    re: /(\d+)\s*(?:und|unid|unidades?|u)\b/g,
    normalize: normalizeNumber,
  },
  { kind: 'rosca', re: /\bm\s?(\d+(?:[.,]\d+)?)\b/g, normalize: normalizeNumber },
  { kind: 'rpm', re: /(\d+(?:[.,]\d+)?)\s*rpm\b/g, normalize: normalizeNumber },
  { kind: 'kg', re: /(\d+(?:[.,]\d+)?)\s*(?:kg|kilos?)\b/g, normalize: normalizeNumber },
  { kind: 'toneladas', re: /(\d+(?:[.,]\d+)?)\s*(?:tn|tons?|toneladas?)\b/g, normalize: normalizeNumber },
  { kind: 'dientes', re: /(\d+)\s*dientes?\b/g, normalize: normalizeNumber },
  // La medida del Torx: T25 y T50 son dos bocallaves distintas y el nombre no
  // trae ninguna otra dimensión que las separe.
  { kind: 'torx', re: /\bt\s?(\d{1,3})\b/g, normalize: normalizeNumber },
  // Lo mismo para Phillips y Pozidriv: PH2, PZ1.
  { kind: 'punta_medida', re: /\bp[hz]\s?(\d)\b/g, normalize: normalizeNumber },
]

export function extractDimensions(name: string): Dimensions {
  const text = normalizeText(name)
  const found: Dimensions = new Map()

  for (const pattern of PATTERNS) {
    // La regex es global y con estado: se clona para que dos llamadas seguidas
    // no arranquen desde el lastIndex que dejó la anterior.
    const re = new RegExp(pattern.re.source, pattern.re.flags)
    for (const match of text.matchAll(re)) {
      const raw = match[1]
      if (raw === undefined) continue
      const value = pattern.normalize(raw)
      const bucket = found.get(pattern.kind)
      if (bucket === undefined) found.set(pattern.kind, new Set([value]))
      else bucket.add(value)
    }
  }

  return found
}

const STOPWORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'para', 'con', 'sin', 'y', 'a', 'en',
  'por', 'un', 'una', 'al', 'tipo',
])

/**
 * El sustantivo que dice qué es el producto: la primera palabra con contenido.
 * Nuestros nombres vienen en Title Case y arrancan por el tipo ("Llave
 * Combinada 14mm", "Mecha HSS 3.50mm"), así que la primera sirve.
 */
export function headNoun(name: string, brand?: string | null): string | null {
  // Varios nombres del cliente arrancan por la marca ("Bosch Cincel Plano"):
  // si la tomáramos como sustantivo, la regla del tipo se vuelve trivial
  // —comparar la marca contra la marca— y deja pasar cualquier producto.
  const brandToken = brand !== null && brand !== undefined ? normalizeBrand(brand) : ''
  for (const token of normalizeText(name).split(/[^a-z0-9]+/)) {
    if (token.length < 3) continue
    if (STOPWORDS.has(token)) continue
    if (/^\d+$/.test(token)) continue
    if (brandToken !== '' && normalizeBrand(token) === brandToken) continue
    return token
  }
  return null
}

/** Quita el plural para que "Llaves" encuentre a "Llave". */
function stem(token: string): string {
  if (token.endsWith('es') && token.length > 5) return token.slice(0, -2)
  if (token.endsWith('s') && token.length > 4) return token.slice(0, -1)
  return token
}

const KIT = /\b(juegos?|sets?|kits?|combos?|surtidos?|maletines?)\b/

/**
 * Variantes mutuamente excluyentes: dentro de un grupo, dos términos distintos
 * son dos productos distintos. Un precinto negro y uno blanco comparten marca,
 * tipo y las dos medidas — lo único que los separa es esta palabra.
 *
 * La regla es simétrica: si un lado nombra un término del grupo y el otro no
 * nombra ninguno, tampoco alcanza. Que ML diga "Largo" donde nuestro nombre
 * calla significa que no sabemos si es el largo o el corto, y adivinar es
 * exactamente lo que no queremos.
 */
type VariantGroup = {
  label: string
  /**
   * Cada variante junta sus sinónimos: "LAR." y "Largo" son el mismo valor.
   * Los términos se compilan como regex entre `\b`, así que `negr\w*` cubre
   * "negro", "negra" y el "Negr" truncado que aparece en el catálogo del
   * cliente por el corte de columna del Excel.
   */
  variants: readonly { value: string; terms: readonly string[] }[]
}

const VARIANT_GROUPS: readonly VariantGroup[] = [
  {
    label: 'largo',
    variants: [
      { value: 'largo', terms: ['larg\\w*', 'lar', 'extralarg\\w*'] },
      { value: 'corto', terms: ['cort\\w*', 'cor'] },
    ],
  },
  {
    label: 'color',
    variants: [
      { value: 'negro', terms: ['negr\\w*'] },
      { value: 'blanco', terms: ['blanc\\w*'] },
      { value: 'rojo', terms: ['roj\\w*'] },
      { value: 'azul', terms: ['azul\\w*'] },
      { value: 'amarillo', terms: ['amarill\\w*'] },
      { value: 'verde', terms: ['verde'] },
      { value: 'naranja', terms: ['naranj\\w*'] },
      { value: 'gris', terms: ['gris'] },
      { value: 'transparente', terms: ['transparent\\w*'] },
    ],
  },
  {
    label: 'genero',
    variants: [
      { value: 'macho', terms: ['macho'] },
      { value: 'hembra', terms: ['hembra'] },
    ],
  },
  {
    label: 'perfil',
    variants: [
      { value: 'hexagonal', terms: ['hexagonal', 'hexagonales', 'hexagono', 'hex'] },
      { value: 'estriado', terms: ['estriado', 'estriada', 'estrias'] },
      { value: 'cuadrado', terms: ['cuadrado', 'cuadrada'] },
      { value: 'torx', terms: ['torx'] },
      { value: 'allen', terms: ['allen'] },
      // Ribe y Spline se parecen y no son lo mismo: son dos perfiles de punta
      // distintos para tornillos de motor. Confundirlos redondea un tornillo.
      { value: 'ribe', terms: ['ribe'] },
      { value: 'spline', terms: ['spline', 'multiestria', 'multiestrias'] },
      { value: 'poligonal', terms: ['poligonal', 'poligonales'] },
      { value: 'estrella', terms: ['estrella'] },
    ],
  },
  {
    // Una llave con crique y una llave fija de la misma medida comparten todo
    // salvo esto, y valen muy distinto.
    label: 'mecanismo',
    variants: [{ value: 'crique', terms: ['crique', 'ratchet', 'matraca', 'reversible'] }],
  },
  {
    label: 'accionamiento',
    variants: [
      { value: 'neumatico', terms: ['neumatic\\w*'] },
      { value: 'electrico', terms: ['electric\\w*'] },
      { value: 'inalambrico', terms: ['inalambric\\w*', 'bateria'] },
    ],
  },
  {
    label: 'punta',
    variants: [
      { value: 'plano', terms: ['plano', 'plana', 'paleta'] },
      { value: 'phillips', terms: ['phillips', 'philips', 'cruz'] },
      { value: 'pozidriv', terms: ['pozidriv'] },
    ],
  },
  {
    label: 'impacto',
    variants: [{ value: 'impacto', terms: ['impacto'] }],
  },
]

/** Qué variantes canónicas de un grupo nombra un texto ya normalizado. */
function variantValues(text: string, group: VariantGroup): Set<string> {
  const found = new Set<string>()
  for (const variant of group.variants) {
    for (const term of variant.terms) {
      if (new RegExp(`\\b${term}\\b`).test(text)) {
        found.add(variant.value)
        break
      }
    }
  }
  return found
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false
  for (const value of a) if (!b.has(value)) return false
  return true
}

export type Verdict =
  | { ok: true; evidence: string[] }
  | { ok: false; reason: string }

export type OurProduct = { name: string; brand: string | null }

/**
 * ¿El SKU del cliente aparece en la ficha como código de fábrica?
 *
 * Para las marcas nacionales —Bremen, Eurotech— el SKU que cargó el cliente ES
 * el código del fabricante, y los vendedores de ML lo ponen en el título o en
 * el atributo de modelo. Cuando eso pasa no estamos comparando parecidos:
 * estamos leyendo el mismo identificador de las dos fuentes, igual que con el
 * EAN. Es la única evidencia de este script que prueba identidad en vez de
 * sugerirla.
 *
 * Se exige de 3 dígitos para arriba y como token completo: un "12" suelto
 * aparece en cualquier título y no identifica nada.
 */
export function skuAppearsAsCode(sku: string, candidate: Candidate): boolean {
  const code = sku.trim()
  if (!/^\d{3,}$/.test(code) && !/^[A-Za-z0-9-]{4,}$/.test(code)) return false
  if (code.length < 3) return false

  const needle = normalizeText(code).replace(/[^a-z0-9]/g, '')
  if (needle.length < 3) return false

  for (const model of candidate.models) {
    if (normalizeText(model).replace(/[^a-z0-9]/g, '') === needle) return true
  }
  // En el título tiene que estar como token suelto, no embebido en otro número:
  // el 3608 de "Eurotech 3608" cuenta, el de un "13608" no.
  return new RegExp(`(?<![a-z0-9])${needle}(?![a-z0-9])`).test(normalizeText(candidate.name))
}

export type Candidate = {
  name: string
  brand: string | null
  /** Valores de MODEL / PART_NUMBER de la ficha, si los trae. */
  models: readonly string[]
}

/**
 * Aplica las cinco reglas. Devuelve la evidencia cuando pasa, para poder
 * auditar después por qué se aceptó sin volver a pegarle a la API.
 */
export type VerifyOptions = {
  /**
   * El SKU aparece como código de fábrica en la ficha (ver skuAppearsAsCode).
   *
   * Lo ÚNICO que habilita es aceptar un producto cuyo nombre no tiene ninguna
   * dimensión: el código ya cumple ese rol. Todo lo demás —marca, tipo, juego,
   * variantes, dimensiones— se sigue exigiendo igual.
   *
   * No es una precaución teórica: "Destapizador 8 Grande Euro" matcheó contra
   * "Llave estructurada Eurotech 3280" cuando el código salteaba las reglas.
   * Los vendedores de ML ponen números en el título que no siempre son el
   * código de fábrica de esa pieza, así que el código acota pero no prueba.
   */
  codeEvidence?: boolean
}

export function verifyCandidate(
  our: OurProduct,
  candidate: Candidate,
  options: VerifyOptions = {},
): Verdict {
  // ── 1. Marca ────────────────────────────────────────────────────────────
  if (our.brand === null || our.brand.trim() === '') {
    return { ok: false, reason: 'nuestro producto no tiene marca: no hay con qué validar' }
  }
  if (candidate.brand === null || candidate.brand.trim() === '') {
    return { ok: false, reason: 'la ficha de ML no declara marca' }
  }
  const ourBrand = normalizeBrand(our.brand)
  const theirBrand = normalizeBrand(candidate.brand)
  const brandMatches =
    ourBrand === theirBrand ||
    ourBrand.includes(theirBrand) ||
    theirBrand.includes(ourBrand)
  if (!brandMatches) {
    return { ok: false, reason: `marca distinta: nuestra "${our.brand}", ML "${candidate.brand}"` }
  }

  const ourText = normalizeText(our.name)
  const theirText = normalizeText(candidate.name)

  // ── 2. Tipo de producto ─────────────────────────────────────────────────
  const noun = headNoun(our.name, our.brand)
  if (noun === null) {
    return { ok: false, reason: 'no se pudo identificar el tipo de producto en nuestro nombre' }
  }
  if (!theirText.includes(stem(noun))) {
    return { ok: false, reason: `el tipo no aparece en la ficha: "${noun}" no está en "${candidate.name}"` }
  }
  // "Llave Tipo T Con Bocallave 14mm" contiene "bocallave", pero es una llave
  // que trae una bocallave, no una bocallave. Si nuestro sustantivo aparece
  // detrás de "con"/"para"/"c/", es un componente y no el producto.
  if (new RegExp(`\\b(?:con|para|c/|incluye|mas)\\s+\\w*\\s*${stem(noun)}`).test(theirText)) {
    return {
      ok: false,
      reason: `"${noun}" aparece en la ficha como accesorio, no como el producto: "${candidate.name}"`,
    }
  }

  // ── 3. Juego contra unidad suelta ───────────────────────────────────────
  const ourIsKit = KIT.test(ourText)
  const theirIsKit = KIT.test(theirText)
  if (ourIsKit !== theirIsKit) {
    return {
      ok: false,
      reason: ourIsKit
        ? 'el nuestro es un juego y la ficha es una unidad suelta'
        : 'el nuestro es una unidad suelta y la ficha es un juego',
    }
  }

  // ── 4. Variantes excluyentes ────────────────────────────────────────────
  for (const group of VARIANT_GROUPS) {
    const ours = variantValues(ourText, group)
    const theirs = variantValues(theirText, group)
    if (ours.size === 0 && theirs.size === 0) continue
    if (!sameSet(ours, theirs)) {
      const show = (set: Set<string>): string => (set.size === 0 ? '(no dice)' : [...set].join('/'))
      return {
        ok: false,
        reason: `variante ${group.label} distinta: nuestro ${show(ours)} contra ML ${show(theirs)}`,
      }
    }
  }

  // ── 5. Dimensiones ──────────────────────────────────────────────────────
  //
  // TODAS las dimensiones de nuestro nombre tienen que estar en el de la ficha,
  // con los mismos valores. Pedir una sola no alcanza: en una familia de
  // bocallaves existe cada medida en cada encastre, así que compartir la
  // medida y nada más deja pasar el encastre equivocado.
  const ourDims = extractDimensions(our.name)
  const theirDims = extractDimensions(candidate.name)

  if (ourDims.size === 0 && options.codeEvidence !== true) {
    return { ok: false, reason: 'nuestro nombre no tiene ninguna dimensión que permita validar' }
  }

  const evidence: string[] = []
  const empty = new Set<string>()

  // La comparación va en las dos direcciones. Que las nuestras estén incluidas
  // en las de la ficha no alcanza: un prolongador de 1/4 "entra" en una ficha
  // que dice "1/4 a 1/4 3/8 1/2", y un cincel suelto entra en un pack de 10.
  // Lo que la ficha declara de más también es una diferencia.
  const kinds = new Set<DimensionKind>([...ourDims.keys(), ...theirDims.keys()])
  for (const kind of kinds) {
    const ourValues = ourDims.get(kind) ?? empty
    const theirValues = theirDims.get(kind) ?? empty
    if (!sameSet(ourValues, theirValues)) {
      const show = (set: ReadonlySet<string>): string =>
        set.size === 0 ? '(no dice)' : [...set].join('/')
      return {
        ok: false,
        reason: `diferencia en ${kind}: nuestro ${show(ourValues)} contra ML ${show(theirValues)}`,
      }
    }
    evidence.push(`${kind}=${[...ourValues].join('/')}`)
  }

  // El modelo de fábrica es prueba fuerte, pero sigue siendo un extra: no
  // reemplaza a la dimensión, la refuerza.
  for (const model of candidate.models) {
    const normalized = normalizeText(model).replace(/[^a-z0-9]/g, '')
    if (normalized.length < 3) continue
    if (ourText.replace(/[^a-z0-9]/g, '').includes(normalized)) {
      evidence.push(`modelo=${model}`)
      break
    }
  }

  if (options.codeEvidence === true) evidence.push('codigo-fabrica')

  if (evidence.length === 0) {
    return { ok: false, reason: 'sin evidencia suficiente' }
  }

  evidence.unshift(`marca=${candidate.brand}`, `tipo=${noun}`)
  return { ok: true, evidence }
}
