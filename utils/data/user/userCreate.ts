"server only"

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { UserCreate } from "@/utils/types";

export const userCreate = async ({
  email,
  firstName,
  lastName,
  profileImageUrl,
  userId,
  role,
}: UserCreate) => {
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
      console.info("[USER_CREATE] User already exists - This is expected behavior in scenarios like:", {
        scenario1: "Multiple webhook deliveries from Clerk (retry mechanism)",
        scenario2: "User re-authenticating after session expiry",
        scenario3: "User signing up with an existing email",
        userId,
        email
      });
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

    if (error?.code === "23505") { // Unique constraint violation
      console.info("[USER_CREATE] Concurrent user creation detected - This is expected behavior when:", {
        scenario1: "Multiple webhook handlers process the same event simultaneously",
        scenario2: "Race condition between authentication and webhook processing",
        email,
        error: "User already exists in database"
      });
      // Fetch and return the existing user instead
      const { data: existingUser } = await supabase
        .from("User")
        .select()
        .eq("email", email)
        .single();
      return existingUser;
    }

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
