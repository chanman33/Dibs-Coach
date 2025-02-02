"server only"

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { UserCreate } from "@/utils/types";

export async function userCreate({
  email,
  firstName,
  lastName,
  profileImageUrl,
  userId,
  role
}: {
  email?: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  userId: string
  role: string
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // First check if user already exists
  const { data: existingUser } = await supabase
    .from("User")
    .select("id")
    .eq("userId", userId)
    .single();

  if (existingUser) {
    console.log("[USER_CREATE] User already exists:", userId);
    return existingUser;
  }

  // Create new user
  const { data, error } = await supabase
    .from("User")
    .insert({
      userId,
      email,
      firstName,
      lastName,
      profileImageUrl,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("[USER_CREATE_ERROR]", {
      error,
      userId,
      email
    });
    throw error;
  }

  console.log("[USER_CREATE] Created new user:", data);
  return data;
}
