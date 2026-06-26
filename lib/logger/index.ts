/**
 * Helpers de observabilidad.
 *
 * Axiom (next-axiom) captura automáticamente todos los `console.*` del
 * servidor, así que acá solo estandarizamos el formato con contexto
 * estructurado y centralizamos el reporte a Sentry.
 *
 * `reportException` se conecta a Sentry en INFRA-07; hoy solo loggea. El resto
 * del código debe llamar a este helper en lugar de a Sentry directamente, para
 * que activar Sentry sea un cambio en un único lugar.
 */

type LogContext = Record<string, unknown>

function serializeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return error.stack ? { message: error.message, stack: error.stack } : { message: error.message }
  }
  return { message: typeof error === 'string' ? error : 'Unknown error' }
}

export function logError(scope: string, message: string, context?: LogContext): void {
  console.error(`[${scope}] ${message}`, context ?? {})
}

export function logInfo(scope: string, message: string, context?: LogContext): void {
  console.info(`[${scope}] ${message}`, context ?? {})
}

export function logWarn(scope: string, message: string, context?: LogContext): void {
  console.warn(`[${scope}] ${message}`, context ?? {})
}

/**
 * Reporta un error no operacional: log estructurado (capturado por Axiom) +
 * Sentry. El import de Sentry es dinámico para no incluirlo en el bundle de
 * edge/cliente cuando no se usa. Si no hay DSN, Sentry queda inerte (no-op).
 */
export function reportException(error: unknown, context?: LogContext): void {
  const { message, stack } = serializeError(error)
  console.error('[capture]', { message, stack, ...context })
  void import('@sentry/nextjs')
    .then((Sentry) => Sentry.captureException(error, context ? { extra: context } : undefined))
    .catch(() => {})
}
