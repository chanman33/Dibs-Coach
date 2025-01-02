"server only"

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { userCreateProps } from "@/utils/types";

export const userCreate = async ({
  email,
  firstName,
  lastName,
  profileImageUrl,
  userId,
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

  try {
    // First check if user already exists
    const { data: existingUser, error: lookupError } = await supabase
      .from("User")
      .select()
      .eq("userId", userId)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      console.error("[USER_CREATE] Error looking up existing user:", lookupError);
      throw new Error(`Failed to check for existing user: ${lookupError.message}`);
    }

    if (existingUser) {
      return existingUser;
    }

    const { data, error } = await supabase
      .from("User")
      .insert([
        {
          email,
          firstName,
          lastName,
          profileImageUrl,
          userId,
          role,
          status: "active",
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[USER_CREATE] Error creating user:", error);
      throw new Error(`Failed to create user: ${error.message}`);
    }

    if (!data) {
      console.error("[USER_CREATE] No data returned after insert");
      throw new Error("Failed to create user: No data returned");
    }

    return data;
  } catch (error: any) {
    console.error("[USER_CREATE] Exception creating user:", error);
    throw new Error(`User creation failed: ${error.message}`);
  }
};
