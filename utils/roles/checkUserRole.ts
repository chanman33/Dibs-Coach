import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { 
  SYSTEM_ROLES, 
  USER_CAPABILITIES,
  type SystemRole,
  type UserCapability,
  type UserRoleContext
} from "./roles";
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

export async function getUserRoleContext(userId: string, context: { isInitialSignup?: boolean } = {}): Promise<UserRoleContext | null> {
  const startTime = Date.now();
  let userUlid: string | undefined;

  // If roles are disabled, return default role for development
  if (!config.roles.enabled) {
    return {
      systemRole: SYSTEM_ROLES.USER,
      capabilities: [USER_CAPABILITIES.MENTEE]
    };
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
      .select("ulid, systemRole, capabilities")
      .eq("userId", userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    userUlid = data?.ulid;

    // Validate system role
    const systemRole = data.systemRole as SystemRole;
    if (!Object.values(SYSTEM_ROLES).includes(systemRole)) {
      return {
        systemRole: SYSTEM_ROLES.USER,
        capabilities: [USER_CAPABILITIES.MENTEE]
      };
    }

    // Validate capabilities
    const capabilities = Array.isArray(data.capabilities) 
      ? data.capabilities.filter(c => Object.values(USER_CAPABILITIES).includes(c))
      : [USER_CAPABILITIES.MENTEE];

    return {
      systemRole,
      capabilities
    };

  } catch (error) {
    return {
      systemRole: SYSTEM_ROLES.USER,
      capabilities: [USER_CAPABILITIES.MENTEE]
    };
  }
}

// For backward compatibility
export async function getUserRole(userId: string, context: { isInitialSignup?: boolean } = {}): Promise<SystemRole> {
  const roleContext = await getUserRoleContext(userId, context) || { systemRole: SYSTEM_ROLES.USER, capabilities: [USER_CAPABILITIES.MENTEE] };
  return roleContext.systemRole;
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

export function hasPermission(roleContext: UserRoleContext, permission: UserCapability): boolean {
  return roleContext.capabilities.includes(permission);
} 