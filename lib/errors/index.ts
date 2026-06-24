/**
 * Jerarquía de errores de la aplicación.
 *
 * Todo error que el código de negocio lanza intencionalmente debe extender
 * `AppError` con `isOperational = true`. Los errores no operacionales (bugs
 * inesperados) llegan al handler como `Error` genérico y se reportan a Sentry.
 *
 * `code` es un identificador interno estable (para logs y clientes), nunca un
 * mensaje de la base de datos ni un stack trace.
 */

export type FieldError = { field: string; message: string }

export class AppError extends Error {
  readonly code: string
  readonly statusCode: number
  readonly isOperational: boolean

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational = true,
  ) {
    super(message)
    this.name = new.target.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    Error.captureStackTrace?.(this, new.target)
  }
}

export class ValidationError extends AppError {
  readonly errors: FieldError[]

  constructor(
    errors: FieldError[],
    message = 'Los datos enviados no son válidos',
    code = 'VALIDATION_ERROR',
  ) {
    super(message, code, 400)
    this.errors = errors
  }
}

export class AuthError extends AppError {
  constructor(message = 'No autenticado', code = 'UNAUTHENTICATED') {
    super(message, code, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'No tenés permiso para esta acción', code = 'FORBIDDEN') {
    super(message, code, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'No encontrado', code = 'NOT_FOUND') {
    super(message, code, 404)
  }
}

export class RateLimitError extends AppError {
  readonly retryAfter: number

  constructor(retryAfter: number, message = 'Demasiados intentos. Probá más tarde.') {
    super(message, 'RATE_LIMITED', 429)
    this.retryAfter = retryAfter
  }
}

export class PaymentError extends AppError {
  readonly mpCode: string
  readonly mpDetail: string

  constructor(message: string, mpCode: string, mpDetail: string) {
    super(message, 'PAYMENT_ERROR', 402)
    this.mpCode = mpCode
    this.mpDetail = mpDetail
  }
}

export class ShippingError extends AppError {
  constructor(message = 'No pudimos cotizar el envío. Probá de nuevo.') {
    super(message, 'SHIPPING_ERROR', 503)
  }
}
