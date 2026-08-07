/**
 * Cambia la contraseña de un usuario. Pensado para recuperar el acceso al
 * panel admin cuando nadie recuerda la clave: el hash bcrypt de la DB no se
 * puede revertir, así que la única salida es pisarlo.
 *
 *   ADMIN_EMAIL=admin@morenoherramientas.com ADMIN_PASSWORD='...' \
 *     npx tsx --env-file=.env.local scripts/set-admin-password.ts
 *
 * La contraseña se pasa por variable de entorno, no por argumento, para que no
 * quede en el historial de la shell ni en la lista de procesos.
 */

import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schemas'

const BCRYPT_ROUNDS = 12 // mismo costo que lib/auth/actions.ts
const MIN_LENGTH = 8 // mismo mínimo que registerSchema

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email) throw new Error('Falta ADMIN_EMAIL')
  if (!password || password.length < MIN_LENGTH) {
    throw new Error(`Falta ADMIN_PASSWORD o tiene menos de ${MIN_LENGTH} caracteres`)
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) throw new Error(`No existe ningún usuario con el email ${email}`)

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  console.log(`Contraseña actualizada para ${user.email} (rol: ${user.role})`)
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
