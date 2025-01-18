"server only"

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { UserCreate } from "@/utils/types";

// Validation function for required fields
function validateUserData(data: UserCreate) {
  const errors: string[] = [];
  
  if (!data.email) errors.push("Email is required");
  if (!data.userId) errors.push("Clerk userId is required");
  if (!data.role) errors.push("Role is required");
  
  // Email format validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  return errors;
}

export const userCreate = async ({
  email,
  firstName,
  lastName,
  profileImageUrl,
  userId,
  role,
}: UserCreate) => {
  // Input validation
  const validationErrors = validateUserData({ email, firstName, lastName, profileImageUrl, userId, role });
  if (validationErrors.length > 0) {
    console.error("[USER_CREATE] Validation errors:", {
      errors: validationErrors,
      userId,
      email
    });
    throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
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
    console.info("[USER_CREATE] Starting user creation process:", {
      userId,
      email,
      role
    });

    // First check if user already exists
    const { data: existingUser, error: lookupError } = await supabase
      .from("User")
      .select()
      .eq("userId", userId)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      console.error("[USER_CREATE] Error looking up existing user:", {
        error: lookupError,
        userId,
        email,
        code: lookupError.code
      });
      throw new Error(`Failed to check for existing user: ${lookupError.message}`);
    }

    if (existingUser) {
      console.info("[USER_CREATE] User already exists - This is expected behavior in scenarios like:", {
        scenario1: "Multiple webhook deliveries from Clerk (retry mechanism)",
        scenario2: "User re-authenticating after session expiry",
        scenario3: "User signing up with an existing email",
        userId,
        email,
        existingUserId: existingUser.id
      });
      return existingUser;
    }

    // Create new user
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
        userId,
        error: "User already exists in database"
      });
      
      // Fetch and return the existing user instead
      const { data: existingUser, error: fetchError } = await supabase
        .from("User")
        .select()
        .eq("userId", userId)
        .single();

      if (fetchError) {
        console.error("[USER_CREATE] Error fetching existing user after conflict:", {
          error: fetchError,
          userId,
          email
        });
        throw new Error(`Failed to fetch existing user: ${fetchError.message}`);
      }

      return existingUser;
    }

    if (error) {
      console.error("[USER_CREATE] Error creating user:", {
        error,
        code: error.code,
        details: error.details,
        userId,
        email
      });
      throw new Error(`Failed to create user: ${error.message}`);
    }

    if (!data) {
      console.error("[USER_CREATE] No data returned after insert:", {
        userId,
        email
      });
      throw new Error("Failed to create user: No data returned");
    }

    console.info("[USER_CREATE] User created successfully:", {
      userId,
      email,
      dbId: data.id
    });

    return data;
  } catch (error: any) {
    console.error("[USER_CREATE] Exception creating user:", {
      error: error.message,
      stack: error.stack,
      userId,
      email
    });
    throw new Error(`User creation failed: ${error.message}`);
  }
};
