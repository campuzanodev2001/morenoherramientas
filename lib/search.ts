import type { Product } from './products'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
}

function scoreProduct(product: Product, normalizedQuery: string): number {
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean)
  if (queryWords.length === 0) return 0

  const nameAndBrand = normalize(product.name + ' ' + product.brand)
  const categoryText = normalize(product.category + ' ' + product.subcategory + ' ' + product.group)
  const descText = normalize(product.description)

  let score = 0
  for (const word of queryWords) {
    if (nameAndBrand.includes(word)) score += 3
    if (categoryText.includes(word)) score += 2
    if (descText.includes(word)) score += 1
  }
  return score
}

export function searchProducts(query: string, allProducts: Product[]): Product[] {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return []

  return allProducts
    .map((product) => ({ product, score: scoreProduct(product, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product)
}