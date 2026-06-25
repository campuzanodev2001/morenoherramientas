import { z } from 'zod'

export const bannerInputSchema = z.object({
  title: z.string().min(1, 'Ingresá el título'),
  imageUrl: z.url('Subí una imagen'),
  linkUrl: z.string().optional().default(''),
  order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
  startsAt: z.string().nullable().optional().default(null),
  endsAt: z.string().nullable().optional().default(null),
})

export type BannerInput = z.input<typeof bannerInputSchema>
