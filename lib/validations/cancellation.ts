import { z } from 'zod'

/**
 * Pedido de arrepentimiento. El motivo es OPCIONAL a propósito: la ley 24.240
 * (art. 34) da el derecho "sin expresión de causa", así que exigir un motivo
 * sería ponerle una traba al ejercicio del derecho.
 */
export const cancellationRequestSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(1, 'Ingresá el número de tu orden')
    .max(40, 'El número de orden es demasiado largo'),
  email: z.email('Email inválido'),
  name: z.string().trim().min(1, 'Ingresá tu nombre').max(120, 'Nombre demasiado largo'),
  phone: z.string().trim().max(30, 'Teléfono demasiado largo').optional(),
  reason: z.string().trim().max(1000, 'El motivo no puede superar los 1000 caracteres').optional(),
})

export type CancellationRequestInput = z.infer<typeof cancellationRequestSchema>

export const cancellationStatusSchema = z.enum(['pending', 'in_review', 'resolved'])

export const resolveCancellationSchema = z.object({
  id: z.string().uuid(),
  status: cancellationStatusSchema,
  adminNote: z.string().trim().max(2000, 'La nota no puede superar los 2000 caracteres').optional(),
})
