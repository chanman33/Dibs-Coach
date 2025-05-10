import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from '@/utils/auth/auth-client'
import { 
  SystemRole,
  OrgRole,
  OrgLevel,
  Permission,
  UserCapability,
  UserRoleContext,
  isValidSystemRole,
  isValidOrgRole,
  isValidOrgLevel,
  SYSTEM_ROLES,
  ORG_ROLES,
  hasPermission as checkHasPermission,
  hasCapability as checkHasCapability
} from "@/utils/roles/roles"
import { generateUlid } from '@/utils/ulid'
import { ApiResponse } from '@/utils/types/api'
import { permissionService, systemRoleHierarchy, orgLevelHierarchy } from '@/utils/auth'
import { AuthOptions, AuthContext } from '@/utils/types/auth'

export interface ServerActionContext {
  userId?: string           // Clerk ID - optional for public actions
  userUlid?: string        // Database ULID - optional for public actions
  systemRole: SystemRole  // System-level role (defaults for public)
  roleContext: UserRoleContext // Full role context (defaults for public)
  organizationUlid?: string // Organization ULID if user has active membership
  organizationName?: string // Organization name if user has active membership
}

interface ServerActionOptions {
  requiredSystemRole?: SystemRole
  requiredOrgRole?: OrgRole
  requiredOrgLevel?: OrgLevel
  requiredPermissions?: Permission[]
  requiredCapabilities?: UserCapability[]
  requireAll?: boolean
  requireOrganization?: boolean
  businessDashboard?: boolean
  allowPublicAccess?: boolean
}

interface OrganizationData {
  role: string
  scope: string
  customPermissions?: Permission[]
  organizationUlid: string
  organization: {
    ulid: string
    level: string
    status: string
    type: string
  }
}

type ServerAction<T, P = any> = (
  params: P,
  ctx: ServerActionContext
) => Promise<ApiResponse<T>>

/**
 * Server action wrapper that handles authentication and authorization.
 * Uses cached auth context and unified middleware for protection.
 */
export function withServerAction<T, P = any>(
  action: ServerAction<T, P>,
  options: AuthOptions = {}
): (params: P) => Promise<ApiResponse<T>> {
  return async (params: P): Promise<ApiResponse<T>> => {
    let clerkSession;
    try {
      clerkSession = await auth();
    } catch (error) {
      console.error('[SERVER_ACTION_CLERK_AUTH_ERROR]', { 
        error, 
        message: error instanceof Error ? error.message : 'Clerk auth() call failed',
        timestamp: new Date().toISOString()
      });
      // If Clerk itself fails, it's an internal error, not just unauthorized
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication service error'
        }
      };
    }

    // If no session and the action does not allow public access, return UNAUTHORIZED
    if (!clerkSession?.userId && !options.allowPublicAccess) {
      return {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      };
    }

    let userDbData: { ulid: string; systemRole: string; capabilities: UserCapability[] } | null = null;
    let orgDbData: any | null = null; // Define type more accurately if possible
    const supabase = await createAuthClient(); // Always uses anon key, RLS is off
    let finalUserUlid: string | undefined = undefined;
    let finalSystemRole: SystemRole = SYSTEM_ROLES.USER;
    let finalCapabilities: UserCapability[] = [];
    let finalOrgRole: OrgRole | undefined = undefined;
    let finalOrgLevel: OrgLevel | undefined = undefined;
    let finalCustomPermissions: Permission[] | undefined = undefined;
    let finalOrganizationUlid: string | undefined = undefined;
    let finalOrganizationName: string | undefined = undefined;

    if (clerkSession?.userId) {
      // User is logged in, try to fetch their DB details
      const { data, error: userError } = await supabase
        .from('User')
        .select('ulid, systemRole, capabilities')
        .eq('userId', clerkSession.userId)
        .single();

      if (userError || !data) {
        // This is an issue if a Clerk session exists but user is not in DB
        console.error('[SERVER_ACTION_USER_NOT_FOUND_FOR_SESSION]', {
          error: userError,
          userId: clerkSession.userId,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User data not found for active session'
          }
        };
      }
      userDbData = data as any; // Cast needed if select isn't strictly typed here
      
      // Check userDbData before accessing its properties
      if (!userDbData) {
          console.error('[SERVER_ACTION_USERDBDATA_NULL]', {
              userId: clerkSession.userId,
              timestamp: new Date().toISOString()
          });
          return {
              data: null,
              error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Failed to process user data'
              }
          };
      }

      finalUserUlid = userDbData.ulid;
      // Ensure userDbData.systemRole is a valid SystemRole before assignment
      if (isValidSystemRole(userDbData.systemRole)) {
        finalSystemRole = userDbData.systemRole;
      } else {
        console.warn('[SERVER_ACTION_INVALID_DB_ROLE]', {
          dbRole: userDbData.systemRole,
          userId: clerkSession.userId,
          defaultedTo: SYSTEM_ROLES.USER,
          timestamp: new Date().toISOString()
        });
        finalSystemRole = SYSTEM_ROLES.USER; // Default to USER if DB role is invalid
      }
      finalCapabilities = (userDbData.capabilities || []) as UserCapability[];

      if (!isValidSystemRole(finalSystemRole)) {
        console.error('[SERVER_ACTION_INVALID_ROLE]', {
          systemRole: finalSystemRole,
          userId: clerkSession.userId,
          timestamp: new Date().toISOString()
        });
        
        return {
          data: null,
          error: {
            code: 'INVALID_ROLE',
            message: 'Invalid system role'
          }
        }
      }

      // Then get the user's organization memberships if they exist
      const { data: orgDataResult, error: orgError } = await supabase
        .from('OrganizationMember')
        .select(`
          role,
          scope,
          customPermissions,
          organizationUlid,
          organization:organizationUlid!inner (
            ulid,
            level,
            status,
            type,
            name
          )
        `)
        .eq('userUlid', finalUserUlid)
        .eq('status', 'ACTIVE')
        .maybeSingle() 

      if (orgError) {
        console.error('[SERVER_ACTION_ORG_QUERY_ERROR]', {
          error: orgError,
          userId: clerkSession.userId,
          timestamp: new Date().toISOString()
        });
        // Depending on policy, might not be a fatal error unless org is required
      }
      
      orgDbData = orgDataResult; // Assign orgDataResult to orgDbData

      // Handle organization requirements for organization-specific routes
      if (options.requireOrganization && !orgDbData) { // Org is required AND user doesn't have org data
        if (finalSystemRole !== SYSTEM_ROLES.SYSTEM_OWNER) { // AND user is NOT a system owner
          // This user is not a system owner and lacks the required organization.
          console.error('[SERVER_ACTION_FORBIDDEN]', {
            message: 'Organization membership required and user is not system owner.',
            userId: clerkSession?.userId,
            userUlid: finalUserUlid,
            organizationRequired: options.requireOrganization,
            hasOrgData: !!orgDbData,
            userSystemRole: finalSystemRole,
            timestamp: new Date().toISOString()
          });
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Organization membership required'
            }
          };
        } else {
          // User IS a system owner, so they bypass this check.
          console.log('[SERVER_ACTION] System owner bypassing organization requirement as org is required but user is owner.', {
            userId: clerkSession?.userId,
            userUlid: finalUserUlid,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Validate org data if it exists
      if (orgDbData) {
        // Check organization status
        if (orgDbData.organization.status !== 'ACTIVE') {
          console.error('[SERVER_ACTION_INACTIVE_ORG]', {
            userId: clerkSession.userId,
            organizationUlid: orgDbData.organizationUlid,
            status: orgDbData.organization.status,
            timestamp: new Date().toISOString()
          });
          
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Organization is not active'
            }
          }
        }

        // Validate org role and level
        if (!isValidOrgRole(orgDbData.role as OrgRole) || !isValidOrgLevel(orgDbData.organization.level as OrgLevel)) {
          console.error('[SERVER_ACTION_INVALID_ORG_ROLE]', {
            userId: clerkSession.userId,
            orgRole: orgDbData.role,
            orgLevel: orgDbData.organization.level,
            timestamp: new Date().toISOString()
          });
          
          return {
            data: null,
            error: {
              code: 'INVALID_ROLE',
              message: 'Invalid organization role or level'
            }
          }
        }
        finalOrgRole = orgDbData.role as OrgRole;
        finalOrgLevel = orgDbData.organization?.level as OrgLevel;
        finalCustomPermissions = orgDbData.customPermissions as Permission[];
        finalOrganizationUlid = orgDbData.organizationUlid;
        finalOrganizationName = orgDbData.organization?.name;
      }

      // Build the role context
      const roleContext: UserRoleContext = {
        systemRole: finalSystemRole,
        capabilities: finalCapabilities,
        orgRole: finalOrgRole,
        orgLevel: finalOrgLevel,
        customPermissions: finalCustomPermissions
      }

      // Create user context for permission service
      const userContextForService = { // Renamed to avoid conflict with other userContext variables
        userId: clerkSession.userId,
        userUlid: finalUserUlid,
        systemRole: finalSystemRole,
        capabilities: finalCapabilities,
        orgRole: finalOrgRole,
        orgLevel: finalOrgLevel,
        organizationUlid: finalOrganizationUlid,
        organizationName: finalOrganizationName,
        // Add customPermissions if your AuthContext for permissionService expects it
        customPermissions: finalCustomPermissions 
      }

      // Configure the permission service with the user context
      permissionService.setUser(userContextForService as AuthContext); // Cast to AuthContext
      
      // Business dashboard roles access check
      if (options.businessDashboard) {
        // This should match the client-side canAccessBusinessDashboard() function logic
        // Use permissionService.canAccessBusinessDashboard()
        if (!permissionService.canAccessBusinessDashboard()) {
            console.log('[SERVER_ACTION_BUSINESS_DASHBOARD_DENIED]', {
                userId: clerkSession.userId,
                userUlid: finalUserUlid,
                timestamp: new Date().toISOString()
            });
            return {
                data: null,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions to access business dashboard'
                }
            };
        }
      }

      // Check auth options if provided
      // Replace direct permissionService.hasSystemRole, etc. with checks against roleContext or by calling permissionService.check(options)
      // For simplicity and to align with how permissionService seems designed, we'll build up the checks.
      // Alternatively, one could adapt permissionService.checkPermissions or use a similar helper.

      if (options.requiredSystemRole) {
        const hasRole = permissionService.getUser()?.systemRole === options.requiredSystemRole || 
                        (permissionService.getUser()?.systemRole === SYSTEM_ROLES.SYSTEM_OWNER); // System owner bypasses lower roles
        // More sophisticated hierarchy check if needed, e.g. systemRoleHierarchy from permission-service.ts
        const hierarchy = systemRoleHierarchy; // Use imported systemRoleHierarchy (lowercase s)
        const userLevel = hierarchy[finalSystemRole] || 0;
        const requiredLevel = options.requiredSystemRole ? (hierarchy[options.requiredSystemRole] || 0) : 0;

        if (userLevel < requiredLevel) {
            console.log('[SERVER_ACTION_PERMISSION_DENIED]', {
              userId: clerkSession.userId,
              userUlid: finalUserUlid,
              requiredSystemRole: options.requiredSystemRole,
              userSystemRole: finalSystemRole,
              timestamp: new Date().toISOString()
            });
            return { data: null, error: { code: 'FORBIDDEN', message: 'Insufficient system role' } };
        }
      }
      
      if (options.requiredOrgRole && finalOrgRole) {
         // Assuming a hierarchy or specific role check is needed.
         // This is a simplified check; a proper hierarchy check (like in permissionService) might be better.
         // For now, checking for exact role or if the user is an OWNER (who might override).
         // This needs to match logic in permissionService if it has hasOrgRole
        const orgHierarchy = orgLevelHierarchy; // Use imported orgLevelHierarchy 
        const userOrgRoleValue = finalOrgRole ? (orgHierarchy[finalOrgRole as keyof typeof orgHierarchy] || -1) : -1;
        const requiredOrgRoleValue = options.requiredOrgRole && orgHierarchy[options.requiredOrgRole as keyof typeof orgHierarchy] ? (orgHierarchy[options.requiredOrgRole as keyof typeof orgHierarchy] || -1) : -1;

        if (userOrgRoleValue < requiredOrgRoleValue) {
            console.log('[SERVER_ACTION_PERMISSION_DENIED]', {
              userId: clerkSession.userId,
              userUlid: finalUserUlid,
              requiredOrgRole: options.requiredOrgRole,
              userOrgRole: finalOrgRole || 'none',
              timestamp: new Date().toISOString()
            });
            return { data: null, error: { code: 'FORBIDDEN', message: 'Insufficient organization permissions' } };
        }
      } else if (options.requiredOrgRole && !finalOrgRole && finalSystemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
        // If org role is required, but user has no org role (and is not system owner)
         console.log('[SERVER_ACTION_PERMISSION_DENIED]', {
            userId: clerkSession.userId,
            userUlid: finalUserUlid,
            requiredOrgRole: options.requiredOrgRole,
            userOrgRole: 'none',
            message: 'Organization role required but not present.',
            timestamp: new Date().toISOString()
          });
        return { data: null, error: { code: 'FORBIDDEN', message: 'Organization membership and role required' } };
      }

      // Check permissions if required
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasRequired = options.requireAll 
          ? options.requiredPermissions.every(p => checkHasPermission(roleContext, p))
          : options.requiredPermissions.some(p => checkHasPermission(roleContext, p));
          
        if (!hasRequired) {
          console.log('[SERVER_ACTION_PERMISSION_DENIED]', {
            userId: clerkSession.userId,
            userUlid: finalUserUlid,
            requiredPermissions: options.requiredPermissions,
            userPermissions: roleContext.customPermissions || [],
            timestamp: new Date().toISOString()
          });
          
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions'
            }
          }
        }
      }

      // Check capabilities if required
      if (options.requiredCapabilities && options.requiredCapabilities.length > 0) {
        const hasRequired = options.requireAll 
          ? options.requiredCapabilities.every(c => checkHasCapability(roleContext, c))
          : options.requiredCapabilities.some(c => checkHasCapability(roleContext, c));
          
        if (!hasRequired) {
          console.log('[SERVER_ACTION_PERMISSION_DENIED]', {
            userId: clerkSession.userId,
            userUlid: finalUserUlid,
            requiredCapabilities: options.requiredCapabilities,
            userCapabilities: roleContext.capabilities || [],
            timestamp: new Date().toISOString()
          });
          
          return {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient capabilities'
            }
          }
        }
      }

      // Construct the context for the server action
      const serverActionContext: ServerActionContext = {
        userId: clerkSession.userId,
        userUlid: finalUserUlid,
        systemRole: finalSystemRole,
        roleContext,
        organizationUlid: finalOrganizationUlid,
        organizationName: finalOrganizationName
      };

      try {
        // The `action` (e.g. fetchCoaches) is called with `params` and the `serverActionContext`.
        // `fetchCoaches` particular signature `async (_, { userUlid })` means it destructures `userUlid` from the context.
        // So, the `userUlid` in `serverActionContext` is what it will receive.
        // If public call, serverActionContext.userUlid will be 'public_ulid' (or undefined if not set above for public).
        // Let's ensure fetchCoaches gets `undefined` for userUlid if public.
        
        const contextForAction = {
          ...serverActionContext,
          userUlid: finalUserUlid // This ensures userUlid is undefined if no userDbData (i.e. public call)
        };

        return await action(params, contextForAction as any); // Use the refined context
      } catch (e) {
        const err = e as Error;
        console.error('[SERVER_ACTION_EXECUTION_ERROR]', {
          error: err.message,
          stack: err.stack,
          actionName: action.name, // May not be reliable depending on JS environment
          params,
          context: serverActionContext,
          timestamp: new Date().toISOString()
        });
        return {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: err.message || 'Server action failed to execute'
          }
        };
      }
    } else { // This 'else' handles the case where clerkSession.userId is null (i.e., public access or no session)
        if (!options.allowPublicAccess) {
             return {
                data: null,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required for this action'
                }
            };
        }
        // Public access allowed, proceed with minimal context
        const publicRoleContext: UserRoleContext = {
            systemRole: SYSTEM_ROLES.USER, // Or a specific public role if defined
            capabilities: [],
            // No org context for public
        };
        const publicServerActionContext: ServerActionContext = {
            // No userId or userUlid for public
            systemRole: publicRoleContext.systemRole,
            roleContext: publicRoleContext,
            // No organization details for public
        };
         try {
            return await action(params, publicServerActionContext as any);
        } catch (e) {
            const err = e as Error;
            console.error('[SERVER_ACTION_PUBLIC_EXECUTION_ERROR]', {
                error: err.message,
                stack: err.stack,
                actionName: action.name,
                params,
                context: publicServerActionContext,
                timestamp: new Date().toISOString()
            });
            return {
                data: null,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: err.message || 'Public server action failed to execute'
                }
            };
        }
    }
  }
}

// Business roles that have access to business dashboard
// This should match the same constant in permission-service.ts
// const businessDashboardRoles = [ // Already defined in permission-service, can be imported or duplicated if necessary
//   ORG_ROLES.OWNER,
//   ORG_ROLES.DIRECTOR,
//   ORG_ROLES.MANAGER
// ] as readonly OrgRole[];

