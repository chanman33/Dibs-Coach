import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAuthClient } from '@/utils/auth'
import { ApiResponse } from '@/utils/types/api'
import { getAuthContext } from '@/utils/auth/auth-context'
import { createAuthMiddleware } from '@/utils/auth/auth-middleware'
import { AuthContext, AuthOptions, UnauthorizedError } from '@/utils/types/auth'
import { 
  SystemRole, 
  OrgRole, 
  OrgLevel,
  Permission,
  UserCapability,
  hasSystemRole,
  hasOrgRole,
  hasPermission,
  hasCapability,
  UserRoleContext
} from '@/utils/roles/roles'
import type { Database } from '@/types/supabase'

type DbUser = Database['public']['Tables']['User']['Row']

export interface AuthenticatedApiContext {
  userId: string           // Clerk ID
  userUlid: string        // Database ULID
  systemRole: SystemRole  // System-level role
  roleContext: UserRoleContext // Full role context including org roles
}

interface ApiAuthOptions {
  requiredSystemRole?: SystemRole
  requiredOrgRole?: OrgRole
  requiredOrgLevel?: OrgLevel
  requiredPermissions?: Permission[]
  requiredCapabilities?: UserCapability[]
  requireAll?: boolean
}

type ApiHandler<T = any> = (
  req: Request,
  ctx: AuthContext
) => Promise<NextResponse<ApiResponse<T>>>

function handleAuthError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

/**
 * API route wrapper that handles authentication and authorization.
 * Uses cached auth context and unified middleware for protection.
 */
export function withApiAuth<T>(handler: ApiHandler<T>, options: AuthOptions = {}) {
  return async (req: Request) => {
    try {
      const context = await getAuthContext()
      await createAuthMiddleware(options)(context)
      return handler(req, context)
    } catch (error) {
      return handleAuthError(error)
    }
  }
}