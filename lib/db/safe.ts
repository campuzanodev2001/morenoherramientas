import { logWarn } from '@/lib/logger'

/**
 * Ejecuta una query y devuelve un fallback si falla (p. ej. la DB no está
 * disponible durante el build estático). En producción, con la DB conectada,
 * el resultado real se sirve y se revalida por ISR.
 *
 * Usar SOLO en el boundary de fetching de páginas del catálogo, nunca para
 * ocultar errores de lógica de negocio.
 */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logWarn('catalog', 'Query falló, usando fallback (¿DB no disponible en build?)', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return fallback
  }
}
