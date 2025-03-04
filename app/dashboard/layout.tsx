import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getAuthContext } from "@/utils/auth"
import NotAuthorized from "@/components/auth/not-authorized"
import DashboardTopNav from "./_components/dashboard-top-nav"
import config from '@/config'
import { UserNotFoundError } from "@/utils/auth/auth-context"

async function recoverUser(userId: string): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/auth/recover`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    })
    
    if (!response.ok) {
      throw new Error('Recovery failed')
    }
    
    const data = await response.json()
    return data.status === 200
  } catch (error) {
    console.error('[DASHBOARD_ERROR] Recovery failed:', error)
    return false
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  try {
    // Add debug logging before auth check
    console.log('[DASHBOARD_LAYOUT] Starting auth context check');
    
    // Single auth check that will throw UserNotFoundError if needed
    const authContext = await getAuthContext()
    
    // Log auth context details
    console.log('[DASHBOARD_LAYOUT] Auth context retrieved:', {
      userId: authContext.userId,
      systemRole: authContext.systemRole,
      capabilities: authContext.capabilities,
      timestamp: new Date().toISOString()
    });

    if (!authContext.userId && config.auth.enabled) {
      console.log('[DASHBOARD_LAYOUT] No userId found with auth enabled');
      redirect('/sign-in')
    }

    if (!config.roles.enabled) {
      console.log('[DASHBOARD_LAYOUT] Roles disabled, rendering without role check');
      return (
        <div className="grid min-h-screen w-full">
          <DashboardTopNav>
            {children}
          </DashboardTopNav>
        </div>
      )
    }

    // Basic auth check - just ensure we have a user with role context
    if (!authContext.systemRole || !authContext.capabilities?.length) {
      console.log('[DASHBOARD_LAYOUT] Missing role context:', {
        systemRole: authContext.systemRole,
        capabilities: authContext.capabilities
      });
      return <NotAuthorized message="User role not found" />
    }

    console.log('[DASHBOARD_LAYOUT] Role check passed, rendering dashboard');
    return (
      <div className="grid min-h-screen w-full">
        <DashboardTopNav>
          {children}
        </DashboardTopNav>
      </div>
    )

  } catch (error) {
    // Don't treat NEXT_REDIRECT as an error
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw redirect to let Next.js handle it
    }
    
    console.error("[DASHBOARD_ERROR] Auth context error:", {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Handle missing user case
    if (error instanceof UserNotFoundError) {
      const userId = error.message.match(/UserId: (.*?)$/)?.[1]
      
      if (userId) {
        // Show loading state while attempting recovery
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Setting up your account...</h2>
              <p className="text-muted-foreground">This may take a few moments.</p>
              {/* Hidden iframe to trigger recovery */}
              <iframe 
                src={`/api/auth/recover?userId=${userId}`}
                style={{ display: 'none' }}
                onLoad={async () => {
                  // After recovery completes, redirect to refresh the page
                  window.location.href = '/dashboard'
                }}
              />
            </div>
          </div>
        )
      }
    }
    
    // For any other errors, redirect to error page
    redirect('/error?code=setup_failed')
  }
}
