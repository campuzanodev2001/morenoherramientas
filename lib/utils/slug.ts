// Rango de marcas diacríticas combinantes (U+0300–U+036F).
const DIACRITICS = /[̀-ͯ]/g

/** Genera un slug URL-safe, manejando acentos y ñ del español. */
export function slugify(input: string): string {
  const base = input
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return base || 'producto'
}
