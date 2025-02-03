import { auth } from "@clerk/nextjs/server";
import { ROLES, hasAnyRole } from "@/utils/roles/roles";
import { redirect } from "next/navigation";
import { ensureUserExists } from "@/utils/auth";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  let user;
  try {
    // This will create the user if they don't exist
    user = await ensureUserExists();
  } catch (error) {
    console.error('[DASHBOARD_ERROR] Error setting up user:', error);
    redirect("/error?code=setup_failed");
  }

  // Route based on user's role
  const roles = [user.role];
  
  // Route to role-specific dashboard
  if (hasAnyRole(roles, [ROLES.ADMIN])) {
    redirect("/dashboard/admin");
  } 
  
  if (hasAnyRole(roles, [ROLES.COACH])) {
    redirect("/dashboard/coach");
  } 
  
  if (hasAnyRole(roles, [ROLES.MENTEE])) {
    redirect("/dashboard/mentee");
  }

  // No valid role found
  console.error('[DASHBOARD_ERROR] Invalid role for user:', { userId, role: user.role });
  redirect("/error?code=invalid_role");
} 