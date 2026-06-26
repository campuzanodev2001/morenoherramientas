import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schemas'
import { getUserByEmailWithHash } from '@/lib/db/queries/users'
import { loginSchema } from '@/lib/validations/auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { logWarn } from '@/lib/logger'
import { onUserWelcome } from '@/lib/mail/hooks'
import type { Role } from '@/lib/db/types'

// Hash dummy para mantener tiempo de respuesta constante cuando el usuario no
// existe (evita timing attacks de enumeración de emails).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-constant-time', 12)

declare module 'next-auth' {
  interface Session {
    user: { id: string; role: Role } & DefaultSession['user']
  }
  interface User {
    role?: Role
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  secret: env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 }, // refresh 7 días
  pages: { signIn: '/login' },
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw, request) => {
        // 1. Rate limiting LOGIN ANTES de cualquier query a la DB.
        const ip = getClientIp(request)
        const rl = await rateLimit('LOGIN', ip)
        if (!rl.success) {
          logWarn('auth', 'Login rate-limited', { ip })
          throw new Error('too_many_attempts')
        }

        const parsed = loginSchema.safeParse(raw)
        if (!parsed.success) return null
        const { email, password } = parsed.data

        // 2. Timing-safe: SIEMPRE ejecutar bcrypt.compare, aun si el usuario no
        //    existe (con hash dummy). No revelar si el email existe.
        const user = await getUserByEmailWithHash(email)
        const hash = user?.passwordHash ?? DUMMY_HASH
        const ok = await bcrypt.compare(password, hash)

        if (!user || !user.passwordHash || !ok) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string
        token.role = (user.role ?? 'customer') as Role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  events: {
    createUser: ({ user }) => {
      // WelcomeEmail al primer registro (fire-and-forget, no bloquea el signIn).
      if (user.id) onUserWelcome(user.id)
    },
  },
})
