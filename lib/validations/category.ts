import { z } from 'zod'

export const categoryInputSchema = z.object({
  name: z.string().min(1, 'Ingresá el nombre'),
  slug: z.string().optional().default(''),
  parentId: z.string().uuid().nullable().optional().default(null),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
})

export type CategoryInput = z.input<typeof categoryInputSchema>
