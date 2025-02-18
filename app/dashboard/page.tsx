import { auth } from "@clerk/nextjs/server";
import { SYSTEM_ROLES, USER_CAPABILITIES, hasCapability, hasSystemRole, type UserRoleContext } from "@/utils/roles/roles";
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
    // Instead of immediately redirecting to error, try to recover
    if (error instanceof Error && error.message.includes('not authenticated')) {
      redirect("/sign-in");
    }
    
    // For other errors, redirect to a special onboarding error page
    // This allows us to handle the error more gracefully and potentially retry user creation
    redirect("/onboarding/error?code=setup_failed");
  }

  // Create proper UserRoleContext from user data
  const userContext: UserRoleContext = {
    systemRole: user.systemRole,
    capabilities: user.capabilities || [],
  };
  
  // Log roles for debugging
  console.log('[DASHBOARD_DEBUG] Processing roles:', {
    userId,
    userContext,
    validRoles: Object.values(SYSTEM_ROLES)
  });

  // Route to role-specific dashboard
  if (hasSystemRole(userContext.systemRole, SYSTEM_ROLES.SYSTEM_OWNER)) {
    redirect("/dashboard/system");
  } 
  
  if (hasCapability(userContext, USER_CAPABILITIES.COACH)) {
    redirect("/dashboard/coach");
  } 
  
  if (hasCapability(userContext, USER_CAPABILITIES.MENTEE)) {
    redirect("/dashboard/mentee");
  }

  // No valid role found - redirect to onboarding instead of error
  console.error('[DASHBOARD_ERROR] Invalid role for user:', { 
    userId, 
    userContext,
    validRoles: Object.values(SYSTEM_ROLES)
  });
  redirect("/onboarding/role");
} 