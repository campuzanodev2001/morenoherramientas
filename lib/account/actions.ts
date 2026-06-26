'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/auth/helpers'
import { parseOrThrow } from '@/lib/errors/validation'
import { handleServerActionError, type ServerActionError } from '@/lib/errors/handlers'
import { ValidationError } from '@/lib/errors'
import { passwordChangeSchema } from '@/lib/validations/auth'
import { getUserPasswordHash, updateUserName, updateUserPasswordHash } from '@/lib/db/queries/users'
import { logInfo } from '@/lib/logger'

type Ok = { success: true }
type ActionResult = Ok | ServerActionError

// Hash dummy para mantener tiempo constante cuando el usuario no tiene password
// (evita revelar por timing si la cuenta usa credentials o solo OAuth).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-constant-time', 12)

const nameSchema = z.object({ name: z.string().trim().min(1, 'Ingresá tu nombre').max(120) })

export async function updateProfileName(name: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const { name: clean } = parseOrThrow(nameSchema, { name })
    await updateUserName(session.user.id, clean)
    revalidatePath('/cuenta/perfil')
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}

const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token']

export async function changePassword(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    const data = parseOrThrow(passwordChangeSchema, input)

    // Timing-safe: SIEMPRE ejecutar bcrypt.compare, exista o no la password.
    const hash = await getUserPasswordHash(session.user.id)
    const ok = await bcrypt.compare(data.currentPassword, hash ?? DUMMY_HASH)
    if (!hash || !ok) {
      // Mensaje genérico: no revela si el actual era incorrecto o si la cuenta
      // no tiene password (OAuth).
      throw new ValidationError([
        { field: 'currentPassword', message: 'No pudimos validar tu contraseña actual' },
      ])
    }

    const newHash = await bcrypt.hash(data.newPassword, 12)
    await updateUserPasswordHash(session.user.id, newHash)
    logInfo('account', 'Password cambiada', { userId: session.user.id })

    // Invalidar la sesión activa: con estrategia JWT borramos la cookie de sesión
    // del dispositivo actual (otros dispositivos caducan al expirar el JWT).
    const jar = await cookies()
    for (const name of SESSION_COOKIES) jar.delete(name)

    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}
