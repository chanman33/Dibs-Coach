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
  const roles = Array.isArray(user.role) ? user.role : [user.role];
  
  // Log roles for debugging
  console.log('[DASHBOARD_DEBUG] Processing roles:', {
    userId,
    roles,
    validRoles: Object.values(ROLES)
  });

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

  // No valid role found - this will only execute if none of the above redirects happen
  console.error('[DASHBOARD_ERROR] Invalid role for user:', { 
    userId, 
    roles,
    validRoles: Object.values(ROLES)
  });
  redirect("/error?code=invalid_role");
} 