import { googleAuthEnabled } from '@/lib/auth'
import RegisterForm from './RegisterForm'

export const metadata = { title: 'Crear cuenta — Moreno Herramientas' }

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const callbackUrl = typeof sp.callbackUrl === 'string' ? sp.callbackUrl : '/'
  return <RegisterForm callbackUrl={callbackUrl} googleEnabled={googleAuthEnabled} />
}
