import { env } from '@/lib/env'
import { logError, logInfo } from '@/lib/logger'
import { mailAlreadySent, recordMailSent } from '@/lib/db/queries/mail-logs'

export type SendMailParams = {
  to: string
  subject: string
  html: string
  template: string
  /** orderId + ':' + templateName (o userId + ':' + templateName). */
  idempotencyKey: string
}

export type SendMailResult = { skipped: boolean }

/** En desarrollo no se envía a Resend; se loggea el HTML. */
function isDevMail(): boolean {
  return env.RESEND_API_KEY.startsWith('dev-')
}

/**
 * Envía un mail con idempotencia (mail_logs). Reclama la clave de forma atómica
 * ANTES de enviar: si otro proceso ya la reclamó (webhook duplicado), no
 * reenvía. Nunca lanza: los errores se loggean.
 */
export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  const { to, subject, html, template, idempotencyKey } = params

  if (await mailAlreadySent(idempotencyKey)) {
    logInfo('mail', 'Mail ya enviado, omitiendo', { template, idempotencyKey })
    return { skipped: true }
  }

  // Reclamo atómico: si perdemos la carrera, no enviamos.
  const claimed = await recordMailSent({ idempotencyKey, to, template })
  if (!claimed) {
    logInfo('mail', 'Mail reclamado por otro proceso, omitiendo', { template, idempotencyKey })
    return { skipped: true }
  }

  if (isDevMail()) {
    logInfo('mail', `[DEV] Mail no enviado (Resend deshabilitado): ${subject}`, { to, template })
    console.log(`\n----- MAIL (${template}) → ${to} -----\n${html}\n----- FIN MAIL -----\n`)
    return { skipped: false }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.RESEND_FROM_EMAIL, to, subject, html }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    logError('mail', 'Resend devolvió error', { status: res.status, template })
  }
  return { skipped: false }
}
