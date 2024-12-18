import { redirect } from 'next/navigation'
import { currentUser } from "@clerk/nextjs/server"
import { getUserRole } from "@/utils/roles/checkUserRole"
import { ROLES } from "@/utils/roles/roles"

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user?.id) {
    redirect('/sign-in')
  }

  const role = await getUserRole(user.id)
  
  const redirectPath = (() => {
    switch (role) {
      case ROLES.REALTOR:
        return '/dashboard/realtor'
      case ROLES.COACH:
        return '/dashboard/coach'
      case ROLES.ADMIN:
        return '/dashboard/admin'
      default:
        return '/dashboard/realtor'
    }
  })()

  redirect(redirectPath)
} 