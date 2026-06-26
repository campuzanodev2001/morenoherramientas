/**
 * Categorías predefinidas para la importación masiva + categorización por
 * palabras clave (08-launch.md). Compartido por generate-categories.ts e
 * import-products.ts.
 */

export const UNCATEGORIZED_SLUG = 'sin-categorizar'

export type ImportCategory = { slug: string; name: string; keywords: string[] }

export const IMPORT_CATEGORIES: ImportCategory[] = [
  {
    slug: 'herramientas-electricas',
    name: 'Herramientas eléctricas',
    keywords: ['taladro', 'amoladora', 'sierra', 'lijadora', 'atornillador'],
  },
  {
    slug: 'herramientas-manuales',
    name: 'Herramientas manuales',
    keywords: ['martillo', 'alicate', 'destornillador', 'llave', 'serrucho'],
  },
  {
    slug: 'tornilleria',
    name: 'Tornillería',
    keywords: ['tornillo', 'tuerca', 'clavo', 'arandela', 'bulon', 'bulón', 'perno'],
  },
  {
    slug: 'plomeria',
    name: 'Plomería',
    keywords: ['caño', 'cano', 'llave de paso', 'valvula', 'válvula', 'sifon', 'sifón', 'griferia', 'grifería'],
  },
  {
    slug: 'electricidad',
    name: 'Electricidad',
    keywords: ['cable', 'enchufe', 'tomacorriente', 'disyuntor', 'termomagnetica', 'termomagnética'],
  },
  {
    slug: 'pintura',
    name: 'Pintura',
    keywords: ['pintura', 'rodillo', 'pincel', 'sellador', 'enduido', 'enduído'],
  },
  {
    slug: 'construccion',
    name: 'Construcción',
    keywords: ['cemento', 'arena', 'ladrillo', 'ladrillos', 'malla', 'hierro'],
  },
  {
    slug: 'jardin',
    name: 'Jardín',
    keywords: ['manguera', 'aspersor', 'rastrillo', 'pala'],
  },
  {
    slug: 'seguridad',
    name: 'Seguridad',
    keywords: ['candado', 'cerradura', 'alarma', 'cadena'],
  },
]

/** Categoría destino (slug) según las palabras clave del nombre del producto. */
export function categorize(productName: string): string {
  const haystack = productName.toLowerCase()
  for (const cat of IMPORT_CATEGORIES) {
    if (cat.keywords.some((kw) => haystack.includes(kw))) return cat.slug
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
