import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ROLES, type UserRole, type UserRoles, hasAnyRole } from "@/utils/roles/roles";
import NotAuthorized from "../not-authorized";
import config from '@/config';

interface WithRoleOptions {
  requiredRoles: UserRole[];
  requireAll?: boolean;
}

export function withRole(
  WrappedComponent: React.ComponentType,
  options: WithRoleOptions | UserRole[]
) {
  // Handle backward compatibility
  const { requiredRoles, requireAll } = Array.isArray(options) 
    ? { requiredRoles: options, requireAll: false }
    : options;

  return function WithRoleWrapper(props: any) {
    if (!config.roles.enabled) {
      return <WrappedComponent {...props} />;
    }

    const { user } = useUser();
    const [userRoles, setUserRoles] = useState<UserRoles | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
      async function fetchUserRoles() {
        if (user?.id) {
          try {
            const response = await fetch(`/api/user/role?userId=${user.id}&isInitialSignup=${isInitialLoad}`);
            const data = await response.json();
            setUserRoles(data.roles);
            setIsInitialLoad(false);
          } catch (error) {
            console.error("[ROLE_FETCH_ERROR]", {
              userId: user.id,
              error,
              context: { isInitialLoad }
            });
            setUserRoles([ROLES.MENTEE]);
            setIsInitialLoad(false);
          }
          setLoading(false);
        }
      }

      fetchUserRoles();
    }, [user?.id]);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!userRoles || !hasAnyRole(userRoles, requiredRoles)) {
      return <NotAuthorized />;
    }

    return <WrappedComponent {...props} userRoles={userRoles} />;
  };
} 