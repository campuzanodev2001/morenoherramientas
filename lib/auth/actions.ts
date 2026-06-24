'use server'

import bcrypt from 'bcryptjs'
import { registerSchema } from '@/lib/validations/auth'
import { createCredentialsUser } from '@/lib/db/queries/users'
import { parseOrThrow } from '@/lib/errors/validation'
import { handleServerActionError, type ServerActionError } from '@/lib/errors/handlers'
import { ValidationError } from '@/lib/errors'

type RegisterResult = { success: true } | ServerActionError

/** Crea un usuario con credentials (bcrypt 12 rounds). */
export async function registerUser(input: unknown): Promise<RegisterResult> {
  try {
    const data = parseOrThrow(registerSchema, input)
    const passwordHash = await bcrypt.hash(data.password, 12)
    const user = await createCredentialsUser({
      name: data.name,
      email: data.email,
      passwordHash,
    })
    if (!user) {
      throw new ValidationError([{ field: 'email', message: 'Ese email ya está registrado' }])
    }
    return { success: true }
  } catch (error) {
    return handleServerActionError(error)
  }
}
