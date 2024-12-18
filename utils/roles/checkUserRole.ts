import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ROLES, type UserRole, rolePermissions, type Permission } from "./roles";

export async function getUserRole(userId: string): Promise<UserRole> {
  const cookieStore = await cookies(); // added await because of the error, cookies() returns a promise per chatgpt
  
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
      .from("user")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    
    return (data?.role || ROLES.REALTOR) as UserRole;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return ROLES.REALTOR; // Default to realtor if there's an error
  }
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  return rolePermissions[userRole]?.[permission as Permission] || false;
} 