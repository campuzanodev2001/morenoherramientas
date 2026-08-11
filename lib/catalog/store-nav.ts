import type { StoreCategory } from '@/lib/db/queries/categories'

/**
 * Helpers de navegación del storefront. Módulo aparte y sin dependencias a
 * propósito: lo consumen Client Components, y importar
 * `lib/catalog/categorization.ts` solo por la constante del slug arrastraría
 * las 250 líneas de reglas de categorización al bundle del navegador.
 */

/**
 * Bolsa interna donde caen los productos que ninguna regla clasificó. Es un
 * detalle de la importación, no una categoría real: al comprador no se le
 * muestra un menú que diga "Sin categorizar".
 *
 * Tiene que coincidir con `UNCATEGORIZED_SLUG` de `lib/catalog/categorization.ts`.
 */
export const UNCATEGORIZED_SLUG = 'sin-categorizar'

/** Las categorías que sí se le muestran al comprador. */
export function navigableCategories(categories: StoreCategory[]): StoreCategory[] {
  return categories.filter((c) => c.slug !== UNCATEGORIZED_SLUG)
}
