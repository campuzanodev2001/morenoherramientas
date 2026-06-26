import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/helpers'
import { getUserById, userHasPassword } from '@/lib/db/queries/users'
import ProfileForm from './ProfileForm'
import PasswordForm from './PasswordForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getServerSession()
  if (!session?.user?.id) redirect('/login?callbackUrl=/cuenta/perfil')

  const [user, hasPassword] = await Promise.all([
    getUserById(session.user.id),
    userHasPassword(session.user.id),
  ])
  if (!user) redirect('/login?callbackUrl=/cuenta/perfil')

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <ProfileForm initialName={user.name ?? ''} email={user.email} emailEditable={hasPassword} />
      {hasPassword && <PasswordForm />}
    </div>
  )
}
