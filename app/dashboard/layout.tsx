import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getAuthContext, UserNotFoundError, createUserIfNotExists } from "@/utils/auth"
import NotAuthorized from "@/components/auth/not-authorized"
import DashboardTopNav from "./_components/dashboard-top-nav"
import config from '@/config'
import { createAuthClient } from "@/utils/auth"
import { auth } from "@clerk/nextjs/server"

// Maximum time to wait for user creation (15 seconds)
const MAX_WAIT_TIME = 15000
const POLL_INTERVAL = 1000

async function waitForUser(userId: string): Promise<boolean> {
  const MAX_ATTEMPTS = 5;
  const DELAY_MS = 1000;
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const supabase = createAuthClient();
      const { data: user, error } = await supabase
        .from('User')
        .select('ulid, systemRole, capabilities')
        .eq('userId', userId)
        .single();
      
      // Try to ensure user exists and has roles
      try {
        await createUserIfNotExists(userId);
      } catch (ensureError) {
        // Always log errors
        console.error('[DASHBOARD_LAYOUT] Error ensuring user:', {
          userId,
          attempt,
          error: ensureError instanceof Error ? ensureError.message : String(ensureError)
        });
      }
      
      // Check if user is ready
      if (user?.ulid && 
          user?.systemRole && 
          Array.isArray(user?.capabilities) && 
          user.capabilities.length > 0) {
        return true;
      }
      
      // Wait before next attempt
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    } catch (error) {
      // Always log errors
      console.error('[DASHBOARD_LAYOUT] Error checking user:', {
        userId,
        attempt,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
  }
  
  return false;
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  try {
    const authContext = await getAuthContext();
    
    if (!authContext) {
      redirect('/sign-in');
    }
    
    // Check if user has all required fields
    const hasCompleteContext = !!(
      authContext.userId &&
      authContext.userUlid &&
      authContext.systemRole &&
      Array.isArray(authContext.capabilities) &&
      authContext.capabilities.length > 0
    );
    
    // If user context is incomplete, wait for it to be ready
    if (!hasCompleteContext) {
      const userReady = await waitForUser(authContext.userId);
      
      if (userReady) {
        // Redirect to refresh the page with the updated auth context
        redirect(`/dashboard?t=${Date.now()}`);
      }
      
      // If still not ready, try to ensure user exists
      try {
        const user = await createUserIfNotExists(authContext.userId);
        
        // Redirect to refresh the page with the updated auth context
        redirect(`/dashboard?t=${Date.now()}`);
      } catch (error) {
        // Always log errors
        console.error('[DASHBOARD_LAYOUT] Error ensuring user exists:', {
          userId: authContext.userId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return (
      <div className="min-h-screen bg-background">
        <DashboardTopNav>
          {children}
        </DashboardTopNav>
      </div>
    )

  } catch (error) {
    // If it's a UserNotFoundError, we should wait for user creation
    if (error instanceof UserNotFoundError) {
      // Extract userId from error message
      const userId = error.message.includes('UserId:') 
        ? error.message.split('UserId:')[1].trim()
        : null;
        
      if (userId) {
        const userReady = await waitForUser(userId);
        
        if (userReady) {
          // Redirect to refresh the page with the updated auth context
          redirect(`/dashboard?t=${Date.now()}`);
        }
        
        // If still not ready, try to ensure user exists
        try {
          const user = await createUserIfNotExists(userId);
          
          // Redirect to refresh the page with the updated auth context
          redirect(`/dashboard?t=${Date.now()}`);
        } catch (createError) {
          // Always log errors
          console.error('[DASHBOARD_LAYOUT] Error creating user after not found:', {
            userId,
            error: createError instanceof Error ? createError.message : String(createError)
          });
        }
      }
    }
    
    // Always log errors
    console.error('[DASHBOARD_LAYOUT] Error in dashboard layout:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">
            We're having trouble loading your dashboard. Please try refreshing the page.
          </p>
          <div className="flex justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
