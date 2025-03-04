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
    // This will throw if user doesn't exist yet
    user = await ensureUserExists(userId);

    // Create proper UserRoleContext from user data
    const userContext: UserRoleContext = {
      systemRole: user.systemRole,
      capabilities: user.capabilities || [],
    };
    
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

    // No valid role found - redirect to onboarding
    redirect("/onboarding/role");

  } catch (error) {
    console.error('[DASHBOARD_ERROR] Error setting up user:', error);
    
    // If user doesn't exist yet, show the setup page
    if (error instanceof Error && error.message.includes('User not found')) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Setting up your account...</h2>
            <p className="text-muted-foreground">This may take a few moments.</p>
            <p className="text-sm text-muted-foreground">If this page persists, please refresh.</p>
          </div>
        </div>
      );
    }
    
    // For other errors, redirect to error page
    redirect("/error?code=setup_failed");
  }
} 