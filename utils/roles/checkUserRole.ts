import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ROLES, type UserRole, rolePermissions, type Permission } from "./roles";
import config from '@/config';

export async function getUserRole(userId: string): Promise<UserRole> {
  // If roles are disabled, return ADMIN role for development
  if (!config.roles.enabled) {
    return ROLES.REALTOR;
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
      .select("role")
      .eq("userId", userId)
      .single();

    if (error) throw error;
    
    return (data?.role || ROLES.REALTOR) as UserRole;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return ROLES.REALTOR;
  }
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  return rolePermissions[userRole]?.[permission as Permission] || false;
} 