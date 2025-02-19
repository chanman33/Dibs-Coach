import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
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
  UserRoleContext,
  SYSTEM_ROLES
} from "@/utils/roles/roles";
import NotAuthorized from "../not-authorized";
import config from '@/config';
import { Loader2 } from "lucide-react";

interface WithRoleOptions {
  requiredSystemRole?: SystemRole;
  requiredOrgRole?: OrgRole;
  requiredOrgLevel?: OrgLevel;
  requiredPermissions?: Permission[];
  requiredCapabilities?: UserCapability[];
  requireAll?: boolean;
  requireOrganization?: boolean;
}

interface UserRoleData {
  systemRole: SystemRole;
  capabilities: UserCapability[];
  organization?: {
    role: OrgRole;
    level: OrgLevel;
    status: string;
    customPermissions?: Permission[];
  };
}

function RoleCheckLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Checking permissions...
        </p>
      </div>
    </div>
  );
}

export function withRole(
  WrappedComponent: React.ComponentType,
  options: WithRoleOptions | SystemRole[]
) {
  // Handle backward compatibility
  const normalizedOptions: WithRoleOptions = Array.isArray(options) 
    ? { requiredSystemRole: options[0] }
    : options;

  return function WithRoleWrapper(props: any) {
    if (!config.roles.enabled) {
      return <WrappedComponent {...props} />;
    }

    const { user } = useUser();
    const [roleContext, setRoleContext] = useState<UserRoleContext | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
      async function fetchUserRoles() {
        if (user?.id) {
          try {
            const response = await fetch(`/api/user/role?userId=${user.id}&isInitialSignup=${isInitialLoad}`);
            const data: { roleData: UserRoleData } = await response.json();
            
            // Build role context from API response
            setRoleContext({
              systemRole: data.roleData.systemRole,
              capabilities: data.roleData.capabilities,
              orgRole: data.roleData.organization?.role,
              orgLevel: data.roleData.organization?.level,
              customPermissions: data.roleData.organization?.customPermissions
            });
            
            setIsInitialLoad(false);
          } catch (error) {
            console.error("[ROLE_FETCH_ERROR]", {
              userId: user.id,
              error,
              context: { isInitialLoad }
            });
            // Fallback to basic user role
            setRoleContext({
              systemRole: SYSTEM_ROLES.USER,
              capabilities: []
            });
            setIsInitialLoad(false);
          }
          setLoading(false);
        }
      }

      fetchUserRoles();
    }, [user?.id]);

    if (loading) {
      return <RoleCheckLoading />;
    }

    if (!roleContext) {
      return <NotAuthorized />;
    }

    // System role validation
    if (normalizedOptions.requiredSystemRole && 
        !hasSystemRole(roleContext.systemRole, normalizedOptions.requiredSystemRole)) {
      return <NotAuthorized />;
    }

    // Organization validation
    if (normalizedOptions.requireOrganization && !roleContext.orgRole) {
      return <NotAuthorized />;
    }

    // Organization role validation
    if (normalizedOptions.requiredOrgRole && normalizedOptions.requiredOrgLevel) {
      if (!roleContext.orgRole || !roleContext.orgLevel) {
        return <NotAuthorized />;
      }

      if (!hasOrgRole(
        roleContext.orgRole, 
        normalizedOptions.requiredOrgRole,
        roleContext.orgLevel,
        normalizedOptions.requiredOrgLevel
      )) {
        return <NotAuthorized />;
      }
    }

    // Permission validation
    if (normalizedOptions.requiredPermissions?.length) {
      const hasRequiredPermissions = normalizedOptions.requireAll
        ? normalizedOptions.requiredPermissions.every(p => hasPermission(roleContext, p))
        : normalizedOptions.requiredPermissions.some(p => hasPermission(roleContext, p));

      if (!hasRequiredPermissions) {
        return <NotAuthorized />;
      }
    }

    // Capability validation
    if (normalizedOptions.requiredCapabilities?.length) {
      const hasRequiredCapabilities = normalizedOptions.requireAll
        ? normalizedOptions.requiredCapabilities.every(c => hasCapability(roleContext, c))
        : normalizedOptions.requiredCapabilities.some(c => hasCapability(roleContext, c));

      if (!hasRequiredCapabilities) {
        return <NotAuthorized />;
      }
    }

    return <WrappedComponent {...props} roleContext={roleContext} />;
  };
} 