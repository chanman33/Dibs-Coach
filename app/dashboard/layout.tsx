import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getAuthContext, UserNotFoundError, createUserIfNotExists } from "@/utils/auth"
import NotAuthorized from "@/components/auth/not-authorized"
import DashboardTopNav from "./_components/dashboard-top-nav"
import DashboardAuthHandler from "./_components/dashboard-auth-handler"
import config from '@/config'
import { createAuthClient } from "@/utils/auth"
import { auth } from "@clerk/nextjs/server"
import { cookies } from "next/headers"

// Maximum time to wait for user creation (15 seconds)
const MAX_WAIT_TIME = 15000
const POLL_INTERVAL = 1000

async function waitForUser(userId: string): Promise<boolean> {
  const MAX_ATTEMPTS = 5;
  const DELAY_MS = 1000;
  
  console.log('[DASHBOARD_LAYOUT] Waiting for user:', { userId, timestamp: new Date().toISOString() });
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const supabase = createAuthClient();
      const { data: user, error } = await supabase
        .from('User')
        .select('ulid, systemRole, capabilities')
        .eq('userId', userId)
        .single();
      
      // Log the attempt
      console.log('[DASHBOARD_LAYOUT] User check attempt:', { 
        userId, 
        attempt, 
        hasUser: !!user,
        error: error ? { code: error.code, message: error.message } : null,
        timestamp: new Date().toISOString()
      });
      
      // Try to ensure user exists and has roles
      try {
        await createUserIfNotExists(userId);
      } catch (ensureError) {
        // Always log errors
        console.error('[DASHBOARD_LAYOUT] Error ensuring user:', {
          userId,
          attempt,
          error: ensureError instanceof Error ? ensureError.message : String(ensureError),
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if user is ready
      if (user?.ulid && 
          user?.systemRole && 
          Array.isArray(user?.capabilities) && 
          user.capabilities.length > 0) {
        console.log('[DASHBOARD_LAYOUT] User is ready:', { 
          userId, 
          userUlid: user.ulid,
          systemRole: user.systemRole,
          capabilities: user.capabilities,
          timestamp: new Date().toISOString()
        });
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
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
  }
  
  console.log('[DASHBOARD_LAYOUT] User wait timeout:', { 
    userId, 
    maxAttempts: MAX_ATTEMPTS,
    timestamp: new Date().toISOString()
  });
  return false;
}

// Function to check if we're coming from the coach application form
// by looking for a timestamp query parameter and cookie
function isComingFromCoachApplication(searchParams: URLSearchParams): boolean {
  // Check if there's a timestamp parameter
  const timestamp = searchParams.get('t');
  
  // For now, just check if there's a timestamp parameter
  // The cookie check will be done on the client side
  return !!timestamp;
}

export default async function DashboardLayout({ 
  children,
  searchParams
}: { 
  children: ReactNode,
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  // Convert searchParams to URLSearchParams for easier handling
  const params = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        params.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      }
    });
  }
  
  // Check if we're coming from the coach application form
  const fromCoachApplication = await isComingFromCoachApplication(params);
  
  // If we're coming from the coach application form, we need to be more careful
  // about race conditions with the auth context
  if (fromCoachApplication) {
    console.log('[DASHBOARD_LAYOUT] Coming from coach application form, adding extra delay', {
      timestamp: new Date().toISOString()
    });
    
    // Add a small delay to ensure database updates are fully propagated
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  try {
    const authContext = await getAuthContext();
    
    if (!authContext) {
      redirect('/sign-in');
    }
    
    // Log the auth context for debugging
    console.log('[DASHBOARD_LAYOUT] Auth context:', {
      userId: authContext.userId,
      userUlid: authContext.userUlid || 'missing',
      systemRole: authContext.systemRole,
      capabilities: authContext.capabilities,
      fromCoachApplication,
      timestamp: new Date().toISOString()
    });
    
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
      console.log('[DASHBOARD_LAYOUT] Incomplete auth context, waiting for user:', { 
        userId: authContext.userId,
        timestamp: new Date().toISOString()
      });
      
      const userReady = await waitForUser(authContext.userId);
      
      if (userReady) {
        // Redirect to refresh the page with the updated auth context
        // Add a cache-busting parameter to ensure a fresh load
        redirect(`/dashboard?t=${Date.now()}`);
      }
      
      // If still not ready, try to ensure user exists
      try {
        console.log('[DASHBOARD_LAYOUT] User not ready, creating user:', { 
          userId: authContext.userId,
          timestamp: new Date().toISOString()
        });
        
        const user = await createUserIfNotExists(authContext.userId);
        
        console.log('[DASHBOARD_LAYOUT] User created successfully:', { 
          userId: authContext.userId,
          userUlid: user.userUlid,
          timestamp: new Date().toISOString()
        });
        
        // Redirect to refresh the page with the updated auth context
        // Add a cache-busting parameter to ensure a fresh load
        redirect(`/dashboard?t=${Date.now()}`);
      } catch (error) {
        // Always log errors
        console.error('[DASHBOARD_LAYOUT] Error ensuring user exists:', {
          userId: authContext.userId,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
        
        // Show a fallback UI instead of redirecting in an infinite loop
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="p-8 max-w-md">
              <h1 className="text-2xl font-bold mb-4">Setting up your account</h1>
              <p className="text-muted-foreground mb-6">
                We're setting up your account. This may take a moment. Please refresh the page in a few seconds.
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
    
    return (
      <div className="min-h-screen bg-background">
        <DashboardTopNav>
          <DashboardAuthHandler>
            {children}
          </DashboardAuthHandler>
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
        console.log('[DASHBOARD_LAYOUT] User not found, waiting for creation:', { 
          userId,
          timestamp: new Date().toISOString()
        });
        
        const userReady = await waitForUser(userId);
        
        if (userReady) {
          // Redirect to refresh the page with the updated auth context
          // Add a cache-busting parameter to ensure a fresh load
          redirect(`/dashboard?t=${Date.now()}`);
        }
        
        // If still not ready, try to ensure user exists
        try {
          console.log('[DASHBOARD_LAYOUT] User not ready after wait, creating user:', { 
            userId,
            timestamp: new Date().toISOString()
          });
          
          const user = await createUserIfNotExists(userId);
          
          console.log('[DASHBOARD_LAYOUT] User created successfully after not found:', { 
            userId,
            userUlid: user.userUlid,
            timestamp: new Date().toISOString()
          });
          
          // Redirect to refresh the page with the updated auth context
          // Add a cache-busting parameter to ensure a fresh load
          redirect(`/dashboard?t=${Date.now()}`);
        } catch (createError) {
          // Always log errors
          console.error('[DASHBOARD_LAYOUT] Error creating user after not found:', {
            userId,
            error: createError instanceof Error ? createError.message : String(createError),
            timestamp: new Date().toISOString()
          });
          
          // Show a fallback UI instead of redirecting in an infinite loop
          return (
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="p-8 max-w-md">
                <h1 className="text-2xl font-bold mb-4">Setting up your account</h1>
                <p className="text-muted-foreground mb-6">
                  We're setting up your account. This may take a moment. Please refresh the page in a few seconds.
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
    }
    
    // Always log errors
    console.error('[DASHBOARD_LAYOUT] Error in dashboard layout:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
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
