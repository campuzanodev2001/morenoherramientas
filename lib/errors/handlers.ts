import { NextResponse } from 'next/server'
import { AppError, ValidationError, RateLimitError } from './index'
import { reportException, logError } from '@/lib/logger'

type ApiErrorBody = {
  error: {
    message: string
    code: string
    details?: unknown
  }
}

/**
 * Handler centralizado para API routes.
 *
 * - Errores operacionales: responde con su `statusCode`, `message` y `code`.
 * - Errores NO operacionales: loggea + reporta a Sentry y responde 500 genérico
 *   sin filtrar stack traces, nombres de tablas ni mensajes de la DB.
 *
 * Uso: `} catch (error) { return handleApiError(error) }`
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorBody> {
  const isOperational = error instanceof AppError && error.isOperational

  logError('api:error', error instanceof Error ? error.message : 'Unknown error', {
    code: error instanceof AppError ? error.code : undefined,
    isOperational,
  })

  if (!isOperational) {
    reportException(error)
    return NextResponse.json(
      { error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }

  const body: ApiErrorBody = {
    error: {
      message: error.message,
      code: error.code,
    },
  }

  if (error instanceof ValidationError) {
    body.error.details = error.errors
  }

  const headers: HeadersInit = {}
  if (error instanceof RateLimitError) {
    headers['Retry-After'] = String(error.retryAfter)
  }

  return NextResponse.json(body, { status: error.statusCode, headers })
}

export type ServerActionError = { success: false; error: string; fields?: { field: string; message: string }[] }

/**
 * Handler para Server Actions. Devuelve una forma serializable que el cliente
 * puede mostrar. Nunca propaga detalles internos de errores no operacionales.
 */
export function handleServerActionError(error: unknown): ServerActionError {
  const isOperational = error instanceof AppError && error.isOperational

  logError('action:error', error instanceof Error ? error.message : 'Unknown error', {
    code: error instanceof AppError ? error.code : undefined,
    isOperational,
  })

  if (!isOperational) {
    reportException(error)
    return { success: false, error: 'Ocurrió un error. Intentá de nuevo.' }
  }

  if (error instanceof ValidationError) {
    return { success: false, error: error.message, fields: error.errors }
  }

  return { success: false, error: error.message }
}
