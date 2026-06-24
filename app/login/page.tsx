import LoginForm from './LoginForm'

export const metadata = { title: 'Ingresar — Moreno Herramientas' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const callbackUrl = typeof sp.callbackUrl === 'string' ? sp.callbackUrl : '/'
  return <LoginForm callbackUrl={callbackUrl} />
}
