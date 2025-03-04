import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/utils/auth";
import { SYSTEM_ROLES, USER_CAPABILITIES } from "@/utils/roles/roles";
import { createAuthClient } from "@/utils/auth";
import { UserNotFoundError } from "@/utils/auth/auth-context";

export default async function DashboardPage() {
  try {
    const authContext = await getAuthContext();

    // Define routing priority and rules
    const routingRules = [
      {
        check: () => authContext.systemRole === SYSTEM_ROLES.SYSTEM_OWNER,
        route: "/dashboard/system"
      },
      {
        check: () => authContext.capabilities.includes(USER_CAPABILITIES.COACH),
        route: "/dashboard/coach"
      },
      {
        check: () => authContext.capabilities.includes(USER_CAPABILITIES.MENTEE),
        route: "/dashboard/mentee"
      }
    ];

    // Find first matching route
    const route = routingRules.find(rule => rule.check())?.route;
    
    if (!route) {
      // Log the issue before attempting to fix
      console.warn('[DASHBOARD_WARNING] User has no valid capabilities:', {
        userId: authContext.userId,
        systemRole: authContext.systemRole,
        capabilities: authContext.capabilities,
        timestamp: new Date().toISOString()
      });

      // Attempt to fix the user's capabilities
      const supabase = await createAuthClient();
      const { error: updateError } = await supabase
        .from('User')
        .update({
          capabilities: [USER_CAPABILITIES.MENTEE],
          updatedAt: new Date().toISOString()
        })
        .eq('userId', authContext.userId);

      if (updateError) {
        console.error('[DASHBOARD_ERROR] Failed to update user capabilities:', {
          error: updateError,
          userId: authContext.userId,
          timestamp: new Date().toISOString()
        });
        throw updateError; // Let the error boundary handle this
      }

      // Redirect to mentee dashboard after fixing capabilities
      redirect("/dashboard/mentee");
    }

    // Redirect to the appropriate dashboard
    redirect(route);

  } catch (error) {
    // Don't treat redirects as errors
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw redirect to let Next.js handle it
    }

    // Handle UserNotFoundError specially
    if (error instanceof UserNotFoundError) {
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
    
    // Log other errors properly
    console.error('[DASHBOARD_ERROR]', {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // Redirect to error page with context
    redirect(`/error?code=dashboard_error&reason=${encodeURIComponent(
      error instanceof Error ? error.message : 'Unknown error occurred'
    )}`);
  }
} 