import { z } from 'zod'

export const productSpecSchema = z.object({
  label: z.string().min(1, 'Falta el nombre de la especificación'),
  value: z.string().min(1, 'Falta el valor'),
})

export const productImageSchema = z.object({
  url: z.url('URL de imagen inválida'),
  alt: z.string().optional().default(''),
  isPrimary: z.boolean().default(false),
})

/** Input del formulario de admin. Precios en PESOS (se convierten a centavos). */
export const productInputSchema = z.object({
  name: z.string().min(1, 'Ingresá el nombre'),
  slug: z.string().optional().default(''),
  sku: z.string().optional().default(''),
  barcode: z.string().optional().default(''),
  brand: z.string().optional().default(''),
  categoryId: z.string().uuid().nullable().optional().default(null),
  price: z.coerce.number().int('Sin decimales').nonnegative('Precio inválido'),
  compareAtPrice: z.coerce.number().int().nonnegative().nullable().optional().default(null),
  stock: z.coerce.number().int().nonnegative('Stock inválido'),
  description: z.string().optional().default(''),
  specs: z.array(productSpecSchema).default([]),
  images: z.array(productImageSchema).default([]),
  active: z.boolean().default(true),
})

export type ProductInput = z.input<typeof productInputSchema>
export type ProductParsed = z.output<typeof productInputSchema>
