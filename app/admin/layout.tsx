import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/helpers'
import AdminShell from './AdminShell'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session?.user) redirect('/login?callbackUrl=/admin')
  if (session.user.role !== 'admin') redirect('/')
  return <AdminShell>{children}</AdminShell>
}
