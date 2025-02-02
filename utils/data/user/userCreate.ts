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
  role,
  memberStatus = 'active'
}: {
  email?: string
  firstName?: string
  lastName?: string
  profileImageUrl?: string
  userId: string
  role: string
  memberStatus?: string
}) {
  console.log("[USER_CREATE] Attempting to create user:", {
    userId,
    email,
    firstName,
    lastName,
    profileImageUrl,
    role,
    memberStatus
  });

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

  // First check if user already exists by userId or email
  const { data: existingUser } = await supabase
    .from("User")
    .select("id")
    .or(`userId.eq.${userId},email.eq.${email}`)
    .single();

  if (existingUser) {
    console.log("[USER_CREATE] User already exists:", { userId, email });
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
      memberStatus,
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
