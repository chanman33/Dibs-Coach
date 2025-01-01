"server only"

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { userCreateProps } from "@/utils/types";

export const userCreate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
  role,
}: userCreateProps) => {
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

  console.log('[USER_CREATE] Environment check:', {
    supabaseUrl: !!process.env.SUPABASE_URL,
    supabaseKey: !!process.env.SUPABASE_SERVICE_KEY
  });

  console.log('[USER_CREATE] Supabase client initialized:', {
    client: !!supabase,
    cookies: !!cookieStore
  });

  try {
    console.log("[USER_CREATE] Starting user creation:", {
      email,
      firstName: first_name,
      lastName: last_name,
      userId: user_id,
      role,
    });

    // First check if user already exists
    const { data: existingUser, error: lookupError } = await supabase
      .from("User")
      .select()
      .eq("userId", user_id)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      console.error("[USER_CREATE] Error looking up existing user:", lookupError);
      throw new Error(`Failed to check for existing user: ${lookupError.message}`);
    }

    if (existingUser) {
      console.log("[USER_CREATE] User already exists:", existingUser);
      return existingUser;
    }

    const { data, error } = await supabase
      .from("User")
      .insert([
        {
          email,
          firstName: first_name,
          lastName: last_name,
          profileImageUrl: profile_image_url,
          userId: user_id,
          role,
          status: "active",
          updatedAt: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("[USER_CREATE] Error creating user:", error);
      throw new Error(`Failed to create user: ${error.message}`);
    }

    console.log('[USER_CREATE] Insert operation result:', {
      data,
      error,
      insertedData: {
        email,
        firstName: first_name,
        lastName: last_name,
        profileImageUrl: profile_image_url,
        userId: user_id,
        role
      }
    });

    console.log("[USER_CREATE] Successfully created user:", data);
    return data;
  } catch (error: any) {
    console.error("[USER_CREATE] Exception creating user:", error);
    throw new Error(`User creation failed: ${error.message}`);
  }
};
