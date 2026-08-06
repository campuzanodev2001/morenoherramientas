/**
 * Taxonomía del catálogo y reglas de categorización.
 *
 * Las categorías salen del catálogo real de Moreno Herramientas, que es de
 * mecánica y taller antes que de ferretería de hogar: el grueso son bocallaves,
 * llaves, extractores, mechas y herramientas de puesta a punto.
 *
 * Las reglas se evalúan EN ORDEN y gana la primera que coincide, así que van
 * de lo más específico a lo más general. El orden importa: "llave de impacto"
 * es neumática aunque diga "llave", y una "mecha" es corte aunque la use un
 * taladro.
 */

export const UNCATEGORIZED_SLUG = 'sin-categorizar'

export type ImportCategory = { slug: string; name: string; keywords: string[] }

/** Categorías del catálogo, en el orden en que se muestran en la tienda. */
export const IMPORT_CATEGORIES: ImportCategory[] = [
  { slug: 'bocallaves-y-accesorios', name: 'Bocallaves y accesorios', keywords: [] },
  { slug: 'llaves', name: 'Llaves', keywords: [] },
  { slug: 'destornilladores-y-puntas', name: 'Destornilladores y puntas', keywords: [] },
  { slug: 'alicates-y-pinzas', name: 'Alicates y pinzas', keywords: [] },
  { slug: 'corte-y-perforacion', name: 'Corte y perforación', keywords: [] },
  { slug: 'extractores-y-mecanica', name: 'Extractores y mecánica', keywords: [] },
  { slug: 'puesta-a-punto', name: 'Puesta a punto', keywords: [] },
  { slug: 'herramientas-electricas', name: 'Herramientas eléctricas', keywords: [] },
  { slug: 'herramientas-neumaticas', name: 'Herramientas neumáticas', keywords: [] },
  { slug: 'aire-comprimido', name: 'Aire comprimido y accesorios', keywords: [] },
  { slug: 'medicion-e-instrumental', name: 'Medición e instrumental', keywords: [] },
  { slug: 'soldadura', name: 'Soldadura', keywords: [] },
  { slug: 'limas-y-abrasivos', name: 'Limas y abrasivos', keywords: [] },
  { slug: 'golpe-y-percusion', name: 'Golpe y percusión', keywords: [] },
  { slug: 'elevacion-y-taller', name: 'Elevación y equipamiento de taller', keywords: [] },
  { slug: 'quimicos-y-lubricantes', name: 'Químicos y lubricantes', keywords: [] },
  { slug: 'fijaciones-y-sujecion', name: 'Fijaciones y sujeción', keywords: [] },
  { slug: 'electricidad-e-iluminacion', name: 'Electricidad e iluminación', keywords: [] },
  { slug: 'seguridad-y-proteccion', name: 'Seguridad y protección', keywords: [] },
  { slug: 'jardin-y-exterior', name: 'Jardín y exterior', keywords: [] },
  { slug: 'accesorios-y-varios', name: 'Accesorios y varios', keywords: [] },
]

type Rule = { slug: string; re: RegExp }

/** Atajo para armar reglas legibles a partir de alternativas. */
const r = (slug: string, ...alts: string[]): Rule => ({
  slug,
  re: new RegExp(`(?:${alts.join('|')})`, 'i'),
})

/**
 * Reglas en orden de prioridad. Las primeras resuelven los casos donde una
 * palabra genérica llevaría a la categoría equivocada.
 */
const RULES: Rule[] = [
  // --- Casos que hay que decidir antes que nada, porque contienen palabras
  // que después caerían en otra categoría ---
  r('herramientas-neumaticas', 'llave de impacto', 'neum\\.', '\\bneum[aá]tic'),
  r(
    'puesta-a-punto',
    'puesta a punto', 'puesta punto', '\\bpp fiat', 'calado', 'distribuci[oó]n',
    'pta\\.? ?a? ?punto', 'pta\\.? ?pto', '\\bvag\\b',
  ),
  r('quimicos-y-lubricantes', '\\bsiloc\\b', '\\btrabasil\\b', '\\bw80\\b', '\\bl80\\b', 'penetrit'),
  // Herramental de aire acondicionado y refrigeración del automotor.
  r('extractores-y-mecanica', 'refrigeraci[oó]n', 'refrigeracion', 'bomba de? ?vacio', 'manifold'),

  // --- Bocallaves y su mundo de accesorios ---
  r(
    'bocallaves-y-accesorios',
    'bocallave', 'boca ?llaves?', '\\bboc\\.', '\\bcrique\\b', 'barra de extensi', 'movimiento universal',
    'manija de fuerza', 'palanca de fuerza', '\\btubos?\\b.*enc', 'enc\\.?\\s*\\d/\\d.*\\btubo',
    'cardan', 'dado de impacto', 'tubos? largos?', 'tubos? impacto', 'tubos? color',
    'caja de tubos?', 'caja tubos?', 'tubos? x ?\\d', 'estriados?x\\d', 'cuadrante palanca',
    'cuadrante de \\d', 'mango de fuerza', 'palanca.{0,12}de fuerza', 'extension x\\d',
    'adaptador.{0,20}(?:hembra|macho)', 'adaptador para impacto', 'hex[aá]gonos desmontar',
    'bocall\\.', 'palanca.{0,20}de fuerza', 'adaptador hexagonal', 'adapt\\.', 'boquilla magnetica',
    'ordenador para tubos', '\\btubo\\b.{0,18}\\d/\\d', 'tubo p/alternador',
  ),

  // --- Destornilladores, puntas e insertos ---
  r(
    'destornilladores-y-puntas',
    'destornillador', 'atornillador', '\\bpunta[s]?\\b', '\\binserto', 'philips', 'phillips',
    'pozidriv', 'buscapolo',
  ),

  // --- Llaves de todo tipo ---
  r(
    'llaves',
    '\\bllave', '\\ballen\\b', '\\btorx\\b', 'combinada', '\\bpico loro\\b', 'francesa',
    'sacafiltro', 'cangreja', '\\bspline\\b', '\\bribe\\b', 'giramacho',
  ),

  // --- Alicates y pinzas ---
  r(
    'alicates-y-pinzas',
    '\\bpinza', '\\balicate', '\\balic\\.', '\\btenaza', '\\bseeger\\b', 'corta cadena',
    'cortacadena', 'pico de loro', 'pico loro', 'crimpeadora', 'pelacable', 'pela cable',
  ),

  // --- Corte, perforación y abrasivos de corte ---
  r(
    'corte-y-perforacion',
    '\\bmecha', '\\bbroca', '\\bsierra', 'disco de corte', 'disco corte', 'disco diamantado',
    'hoja de calar', 'hoja de sierra', '\\bfresa', '\\bcuchilla', 'cortafierro', 'corta fierro',
    'corta ca[nñ]o', 'tijera', 'cutter', 'trincheta', 'arco de sierra', 'escariador', 'avellanador',
    '\\bmacho', 'cojinete', 'terraja', 'copa bimetalica', 'copa bimet[aá]lica', 'sierra copa',
    'serrucho', 'pesta[nñ]adora', 'cortadora de', 'discos? de corte', 'sds ?plus', 'sds ?max',
    'hojas? (?:stanley|rep)', 'hoja.{0,20}trabajo pesado', 'sacabocados', 'mandril',
  ),

  // --- Extractores y herramientas específicas de mecánica ---
  r(
    'extractores-y-mecanica',
    'extractor', 'separador', 'prensa aro', 'compresometro', 'compres[oó]metro', 'bru[nñ]idor',
    'rectificador', 'sonda lambda', 'inyector', 'carburador', 'volante magn', 'porta bujes',
    'saca bujes', 'sacabujes', 'caliper', 'rotula', 'r[oó]tula', 'homocinetica', 'cigue[nñ]al',
    'aros de piston', 'v[aá]lvula[s]? de motor', 'comprimidor', 'prensa resorte',
    'prensa espirales', 'prensa manguera', 'kit air ?bag', 'kit alternador', 'kit tensor',
    'centrador de embrague', 'traba de [aá]rbol', 'traba de arbol', 'traba bomba',
    'falso actuador', 'desconector', 'gancho saca', 'gancho t para', 'tubo amortiguador',
    'tren delantero', 'sellos de v[aá]lvula', 'destapizador', 'aguantador', 'palanca gomero',
    'desmontaje interiores', 'protector trompa', 'alineador de cadena', 'nucleos v[aá]lvula',
    'n[uú]cleos v[aá]lvula', 'poly-?v', 'pata[s]? de cabra', 'cazoleta', 'embrague',
    'sacabollo', 'saca bollo', 'chapista', 'saca ?filtro combustible', 'ext de rodam',
    '\\bgarras\\b', 'brun ?idor', 'generador de pulsos',
  ),

  // --- Herramientas eléctricas ---
  r(
    'herramientas-electricas',
    'amoladora', 'taladro', 'lijadora', 'rotomartillo', 'roto martillo', 'hidrolav', 'caladora',
    'sierra circular', 'ingletadora', 'router', 'fresadora', 'pulidora', 'termofusora',
    'desmalezadora', 'motosierra', 'aspiradora', 'soplador', 'engrampadora el',
    'atornillador a bater', 'esmeril', 'agujereadora', 'minitorno', 'dremel',
    'equipo el[eé]ctrico para pintar', '\\bcombo\\b.{0,30}(?:talad|amolad)', 'pulverizador',
    'herramienta oscilatoria', 'acanaladora', 'mezclador', '\\bbomba\\b.{0,40}(?:hp|w\\b|l/min|presurizadora|centrifuga|sumergible|elevadora|periferica)',
    'bomba presurizadora', 'bomba centrifuga', 'bomba sumergible', 'bomba elevadora',
  ),

  // --- Aire comprimido: compresores, racores, mangueras, pistolas ---
  r(
    'aire-comprimido',
    'compresor', '\\bracord', '\\bacople', 'manguera espiral', 'pistola de soplado',
    'pistola sopladora', 'aceitera', 'filtro regulador', 'filtro-regulador', 'arrestallama',
    'inflador', 'mang\\.espiral', 'manguera espiral', 'manguera esp', 'pico para aire',
    'engrasador', 'balde engrase', 'pistola para pintar', '\\bhvlp\\b', 'desempolvadora',
    'rociadora', 'pistola aplicaci', 'pico inflar', 'infla ?mide', 'trampa de agua',
  ),

  // --- Medición e instrumental ---
  r(
    'medicion-e-instrumental',
    'calibre', 'micrometro', 'micr[oó]metro', 'torquimetro', 'torqu[ií]metro', 'torq\\.',
    'manometro', 'man[oó]metro', 'medidor', 'nivel\\b', 'cinta metrica', 'cinta m[eé]trica',
    'escuadra', 'goniometro', 'gonimetro', 'goneometro', 'tester', 'multimetro', 'mult[ií]metro',
    'probador', 'term[oó]metro', 'osciloscopio', 'scanner', 'comparador', 'reloj comparador',
    'alesometro', 'ales[oó]metro', 'plomada', 'regla', 'flexometro', 'chispometro',
    'vacuometro', 'vacu[oó]metro', 'combimetro', 'estetoscopio', 'boroscopio', 'endoscopio',
    'detector de materiales', 'transportador de grados', 'caudal[ií]metro', 'balanza',
    '\\bsondas\\b', 'metro de madera', '\\bmetro\\b.{0,20}carpintero',
  ),

  // --- Soldadura ---
  r(
    'soldadura',
    'soldador', 'soldadura', 'electrodo', 'soplete', '\\bmig\\b', '\\btig\\b', 'estaño',
    'esta[nñ]o', 'mascara de soldar', 'm[aá]scara de soldar', 'alambre flux', 'fundente',
    'tobera', 'regulador de arg[oó]n', 'alambre \\d[.,]\\d', 'careta', 'alambre para soldar',
    'soporte magn[eé]tico', 'cartucho gas', '\\binverter\\b', '\\bmma\\b',
  ),

  // --- Limas, cepillos y abrasivos ---
  r(
    'limas-y-abrasivos',
    '\\blima', '\\bcepillo', '\\blija', 'piedra de', 'disco flap', 'disco de desbaste',
    'grata', 'esmeriladora de banco', 'muela', 'pa[nñ]o microfibra', 'pa[nñ]ogra',
    'escofina', 'arenadora', 'arenador', '^s[a-f]-\\d', 'piedra fina',
  ),

  // --- Golpe y percusión ---
  r(
    'golpe-y-percusion',
    'martillo', '\\bmaza\\b', '\\bcincel', '\\bpunz[oó]n', 'barreta', 'botador', 'granete',
    'remachadora', 'lezna',
  ),

  // --- Elevación y equipamiento de taller ---
  r(
    'elevacion-y-taller',
    'gato hidra', 'gato de', 'caballete', 'camilla', 'banquito', 'carro portaherramienta',
    'carro porta', 'caja de herramienta', 'tablero portaherramienta', 'mesa rodante',
    'mesa porta', 'bolso de trabajo', 'bolso porta', 'valija', 'maletin', 'malet[ií]n',
    'escalera', 'morsa', 'morza', 'prensa de banco', 'organizador', 'estanteria', 'gr[uú]a',
    'caja para herramienta', 'prensa \\d+ ?tns', 'plato (?:redondo|rectangular) magnetico',
    'barra magnetica', 'sujeta herramienta', '\\bim[aá]n\\b', 'cig[uü]e[nñ]a',
    'expansor hidraulico', 'elevador de', 'ganchos para tablero', 'batea ultras',
    'banco de motor', 'soporte de motor', 'inclinador de motor', 'sacacaja',
  ),

  // --- Químicos, lubricantes y adhesivos ---
  r(
    'quimicos-y-lubricantes',
    'silicona', 'lubricante', '\\bgrasa\\b', 'aceite', 'adhesivo', 'pegamento', 'loctite',
    'desengrasante', 'limpia', 'anaerobico', 'anaer[oó]bico', 'sellador', 'masilla', 'aflojatodo',
    'refrigerante', 'anticongelante', 'cinta teflon', 'cinta tefl[oó]n', 'pintura', 'aerosol',
    'removedor', 'solvente', 'afloja ?todo', 'adhe\\.', 'ciano ?cm', 'cianoacrilato',
    'desplazante de humedad', 'arranca motores', 'autopolish', 'pegamil', 'permatex',
    'cinta doble faz', 'cinta de espuma', 'cinta templex', 'lubricante', 'liquido.{0,20}inyec',
  ),

  // --- Fijaciones y sujeción ---
  r(
    'fijaciones-y-sujecion',
    'remache', 'precinto', 'tornillo', 'tuerca', 'arandela', 'bulon', 'bul[oó]n', 'abrazadera',
    'grampa', 'sujetador', 'clamp', 'anillo seguer', 'seguer', 'chaveta', 'esp[aá]rrago',
    'tarugo', 'zuncho', '\\bgrapa', 'engrapadora', 'engrampadora', 'clavadora', '\\boring',
    '\\bo-?ring',
  ),

  // --- Electricidad e iluminación ---
  r(
    'electricidad-e-iluminacion',
    'linterna', 'reflector', '\\bl[aá]mpara', '\\bled\\b', '\\bcable', 'enchufe', 'tomacorriente',
    'disyuntor', 'termomagnetica', 'termomagn[eé]tica', 'bater[ií]a', 'cargador', 'arrancador',
    'pila\\b', 'zapatilla', 'prolongador', 'cinta aisla', 'cinta aisladora', 'luz de',
    'resistencia .{0,14}tubular',
  ),

  // --- Seguridad y protección ---
  r(
    'seguridad-y-proteccion',
    'lentes de seguridad', 'anteojos', 'guantes', 'protector auditivo', 'tapones', 'casco',
    'mascarilla', 'barbijo', 'arn[eé]s', 'matafuego', 'chaleco', 'faja lumbar', 'candado',
    'cerradura', '\\bguante',
  ),

  // --- Jardín y exterior ---
  r(
    'jardin-y-exterior',
    'manguera de riego', 'aspersor', 'rastrillo', '\\bpala\\b', 'tijera de podar', 'regadera',
    'bordeadora', 'c[eé]sped', 'cesped',
  ),

  // Lo que no es herramienta: termos, mates, marcación, accesorios de taller.
  r(
    'accesorios-y-varios',
    '\\bmate\\b', '\\btermo\\b', 'bombilla', 'marcador', 'l[aá]piz', 'tiza', 'tira l[ií]nea',
    'tira linea', 'marcaci[oó]n', 'botella', 'blister x', 'calefactor', 'estufa', 'ventilador',
    'gazebo', 'campera', 'pistola de calor',
  ),
]

/** Categoría destino (slug) según el nombre del producto. */
export function categorize(productName: string): string {
  for (const rule of RULES) {
    if (rule.re.test(productName)) return rule.slug
  }
  return UNCATEGORIZED_SLUG
}

/** Todas las categorías a crear, incluida la de descarte. */
export function allImportCategories(): { slug: string; name: string }[] {
  return [
    ...IMPORT_CATEGORIES.map((c) => ({ slug: c.slug, name: c.name })),
    { slug: UNCATEGORIZED_SLUG, name: 'Sin categorizar' },
  ]
}
