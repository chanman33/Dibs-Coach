import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ROLES, type UserRole } from "@/utils/roles/roles";
import NotAuthorized from "../not-authorized";
import config from '@/config';

export function withRole(
  WrappedComponent: React.ComponentType,
  requiredRole: UserRole[]
) {
  return function WithRoleWrapper(props: any) {
    if (!config.roles.enabled) {
      return <WrappedComponent {...props} />;
    }

    const { user } = useUser();
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      async function fetchUserRole() {
        if (user?.id) {
          try {
            const response = await fetch(`/api/user/role?userId=${user.id}`);
            const data = await response.json();
            setUserRole(data.role);
          } catch (error) {
            console.error("Error fetching user role:", error);
            setUserRole(ROLES.REALTOR);
          }
          setLoading(false);
        }
      }

      fetchUserRole();
    }, [user?.id]);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!userRole || !requiredRole.includes(userRole)) {
      return <NotAuthorized />;
    }

    return <WrappedComponent {...props} />;
  };
} 