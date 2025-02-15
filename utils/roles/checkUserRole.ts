import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ROLES, type UserRole, type UserRoles, validateRoles, rolePermissions, Permission } from "./roles";
import config from '@/config';

const MAX_RETRIES = 3;
const RETRY_DELAY = 500;

interface RoleCheckMetrics {
  startTime: number;
  attempts: number;
  success: boolean;
  errorCode?: string;
  duration: number;
  userUlid?: string;
}

const metrics: RoleCheckMetrics[] = [];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logMetrics(metric: RoleCheckMetrics) {
  metrics.push(metric);
  console.info('[GET_USER_ROLES_METRICS]', {
    timeToComplete: `${metric.duration}ms`,
    attempts: metric.attempts,
    success: metric.success,
    errorCode: metric.errorCode
  });
}

export async function getUserRoles(userId: string, context: { isInitialSignup?: boolean } = {}): Promise<UserRoles | null> {
  const startTime = Date.now();
  let userUlid: string | undefined;

  // If roles are disabled, return default role for development
  if (!config.roles.enabled) {
    logMetrics({
      startTime,
      attempts: 0,
      success: true,
      duration: Date.now() - startTime,
      userUlid
    });
    return [ROLES.MENTEE];
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const { data, error } = await supabase
      .from("User")
      .select("ulid, role")
      .eq("userId", `${userId}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[GET_USER_ROLES] New user detected: ${userId}`);
        logMetrics({
          startTime,
          attempts: 1,
          success: true,
          duration: Date.now() - startTime,
          userUlid
        });
        return null;
      }
      throw error;
    }

    userUlid = data?.ulid;

    // Success case
    logMetrics({
      startTime,
      attempts: 1,
      success: true,
      duration: Date.now() - startTime,
      userUlid
    });

    // Handle the case where role is either a string array or needs to be parsed
    let roles: string[] = [];
    if (data?.role) {
      roles = Array.isArray(data.role) ? data.role : [data.role];
    }

    // Validate and return roles, defaulting to MENTEE if no valid roles
    try {
      return validateRoles(roles);
    } catch (e) {
      console.warn("[GET_USER_ROLES] No valid roles found, using default:", {
        userId,
        userUlid,
        roles,
        error: e
      });
      return [ROLES.MENTEE];
    }
  } catch (error) {
    console.error("[GET_USER_ROLES] Error:", {
      userId,
      userUlid,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Date.now() - startTime}ms`
    });
    return [ROLES.MENTEE];
  }
}

// For backward compatibility
export async function getUserRole(userId: string, context: { isInitialSignup?: boolean } = {}): Promise<UserRole> {
  const roles = await getUserRoles(userId, context) || [ROLES.MENTEE];
  return roles[0];
}

// Export metrics for monitoring
export function getRoleCheckMetrics() {
  return {
    totalChecks: metrics.length,
    averageAttempts: metrics.reduce((acc, m) => acc + m.attempts, 0) / metrics.length,
    successRate: metrics.filter(m => m.success).length / metrics.length,
    averageDuration: metrics.reduce((acc, m) => acc + m.duration, 0) / metrics.length,
    errorCodes: metrics.reduce((acc, m) => {
      if (m.errorCode) {
        acc[m.errorCode] = (acc[m.errorCode] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  };
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  return rolePermissions[userRole]?.[permission as Permission] || false;
} 