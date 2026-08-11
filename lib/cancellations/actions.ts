'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/helpers'
import { parseOrThrow } from '@/lib/errors/validation'
import { handleServerActionError, type ServerActionError } from '@/lib/errors/handlers'
import { RateLimitError, ValidationError } from '@/lib/errors'
import { rateLimit } from '@/lib/rate-limit'
import { logInfo } from '@/lib/logger'
import {
  cancellationRequestSchema,
  resolveCancellationSchema,
} from '@/lib/validations/cancellation'
import {
  createCancellationRequest,
  findOrderForCancellation,
  hasOpenCancellationRequest,
  updateCancellationRequest,
} from '@/lib/db/queries/cancellation-requests'
import { sendCancellationRequestEmails } from '@/lib/mail/dispatch'

type Ok = { success: true }
type ActionResult = Ok | ServerActionError

/**
 * IP del cliente dentro de una Server Action. `getClientIp` toma un Request,
 * que acá no existe, así que se lee de los headers con la misma regla: en
 * Vercel el X-Forwarded-For es `cliente, proxy1, ...` y la real es la primera.
 */
async function clientIp(): Promise<string> {
  const h = await headers()
  const xff = h.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  return h.get('x-real-ip')?.trim() || '127.0.0.1'
}

/**
 * Registra un pedido de arrepentimiento (Res. 424/2020 SCI).
 *
 * Es una ruta PÚBLICA y sin sesión a propósito: el comprador invitado también
 * tiene el derecho, y obligarlo a crear una cuenta para ejercerlo sería una
 * traba. Por eso lleva rate limiting por IP.
 *
 * Nunca revela si la orden existe: la respuesta es la misma matchee o no, para
 * no habilitar enumeración de números de orden. Cuando no matchea, el pedido
 * igual se guarda (sin `orderId`) y el mail al admin lo marca para revisar.
 */
export async function submitCancellationRequest(input: {
  orderNumber: string
  email: string
  name: string
  phone?: string
  reason?: string
}): Promise<ActionResult> {
  try {
    const limit = await rateLimit('CHECKOUT', `cancellation:${await clientIp()}`)
    if (!limit.success) throw new RateLimitError(limit.retryAfter)

    const data = parseOrThrow(cancellationRequestSchema, input)

    if (await hasOpenCancellationRequest(data.orderNumber, data.email)) {
      throw new ValidationError([
        {
          field: 'orderNumber',
          message: 'Ya recibimos un pedido para esta orden y lo estamos gestionando.',
        },
      ])
    }

    const order = await findOrderForCancellation(data.orderNumber, data.email)

    const request = await createCancellationRequest({
      orderId: order?.id ?? null,
      orderNumber: data.orderNumber,
      email: data.email,
      name: data.name,
      phone: data.phone,
      reason: data.reason,
    })

    logInfo('cancellation', 'Pedido de arrepentimiento registrado', {
      requestId: request.id,
      orderFound: order !== null,
    })

    await sendCancellationRequestEmails(request.id, {
      orderNumber: data.orderNumber,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      reason: data.reason ?? null,
      orderFound: order !== null,
    })

    revalidatePath('/admin/arrepentimientos')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

/** Cambia el estado de un pedido y deja la nota interna. Solo admin. */
export async function resolveCancellationRequest(input: {
  id: string
  status: 'pending' | 'in_review' | 'resolved'
  adminNote?: string
}): Promise<ActionResult> {
  try {
    await requireRole('admin')
    const data = parseOrThrow(resolveCancellationSchema, input)

    await updateCancellationRequest(data.id, {
      status: data.status,
      adminNote: data.adminNote,
    })

    revalidatePath('/admin/arrepentimientos')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}
