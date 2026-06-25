import { z } from 'zod'

/** Código postal argentino: exactamente 4 dígitos numéricos. */
export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, 'El código postal debe tener 4 dígitos')

export const shippingAddressSchema = z.object({
  street: z.string().trim().min(1, 'Ingresá la calle'),
  number: z.string().trim().min(1, 'Ingresá el número'),
  floor: z.string().trim().optional(),
  apartment: z.string().trim().optional(),
  city: z.string().trim().min(1, 'Ingresá la ciudad'),
  province: z.string().trim().min(1, 'Ingresá la provincia'),
  postalCode: postalCodeSchema,
  country: z.string().trim().default('AR'),
})

export const buyerSchema = z.object({
  name: z.string().trim().min(1, 'Ingresá tu nombre'),
  email: z.email('Email inválido'),
  phone: z
    .string()
    .trim()
    .min(6, 'Ingresá un teléfono válido')
    .max(30, 'Teléfono demasiado largo'),
})

/** Línea de carrito tal como la envía el cliente: solo id y cantidad. */
export const cartLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(999),
})

export const quoteRequestSchema = z.object({
  postalCode: postalCodeSchema,
  items: z.array(cartLineSchema).min(1, 'El carrito está vacío'),
})

export const createPreferenceSchema = z.object({
  buyer: buyerSchema,
  shippingAddress: shippingAddressSchema,
  shippingQuoteId: z.string().uuid('Seleccioná un método de envío'),
  items: z.array(cartLineSchema).min(1, 'El carrito está vacío'),
})

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>
export type BuyerInput = z.infer<typeof buyerSchema>
export type CartLineInput = z.infer<typeof cartLineSchema>
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>
export type CreatePreferenceInput = z.infer<typeof createPreferenceSchema>
