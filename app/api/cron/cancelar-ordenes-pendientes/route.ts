import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { cancelStalePendingOrders } from '@/lib/db/queries/orders'
import { logInfo } from '@/lib/logger'
import { handleApiError } from '@/lib/errors/handlers'

export const runtime = 'nodejs'

/** Órdenes 'pending' más viejas que esto se cancelan. */
const MAX_PENDING_AGE_MS = 30 * 60 * 1000

/**
 * GET /api/cron/cancelar-ordenes-pendientes
 * Solo acepta requests con header Authorization: Bearer CRON_SECRET.
 * Configurado en vercel.json una vez por día (plan Hobby de Vercel solo
 * admite crons diarios). Cancela todas las órdenes pendientes que superen
 * MAX_PENDING_AGE_MS al momento de correr, así que la frecuencia no cambia
 * el criterio, solo cuánto tardan en limpiarse.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const cancelled = await cancelStalePendingOrders(MAX_PENDING_AGE_MS)
    logInfo('cron:cancel-pending', 'Órdenes pendientes canceladas', { cancelled })
    return NextResponse.json({ cancelled })
  } catch (error) {
    return handleApiError(error)
  }
}
