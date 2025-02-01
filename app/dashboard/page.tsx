import { auth } from "@clerk/nextjs/server";
import { getUserRoles } from "@/utils/roles/checkUserRole";
import { ROLES, hasAnyRole } from "@/utils/roles/roles";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const roles = await getUserRoles(userId);

  // Route based on highest privilege role
  if (hasAnyRole(roles, [ROLES.ADMIN])) {
    redirect("/dashboard/admin");
  } else if (hasAnyRole(roles, [ROLES.COACH])) {
    redirect("/dashboard/(role-specific)/coach");
  } else {
    // Default to mentee dashboard
    redirect("/dashboard/(role-specific)/mentee");
  }

  // This point should never be reached due to redirects
  return null;
} 