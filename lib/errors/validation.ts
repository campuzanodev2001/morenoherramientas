import { ZodError, type ZodSchema } from 'zod'
import { ValidationError, type FieldError } from './index'

/**
 * Convierte un `ZodError` en la forma `{ field, message }[]` que consumen los
 * formularios del cliente. El `path` se serializa con puntos
 * (ej: `shippingAddress.postalCode`).
 */
export function formatZodError(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : '_root',
    message: issue.message,
  }))
}

/**
 * Valida `data` contra `schema`. Devuelve el valor parseado y tipado, o lanza
 * un `ValidationError` operacional con los errores por campo ya formateados.
 */
export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(formatZodError(result.error))
  }
  return result.data
}
