"server only"

import { createClient } from '@supabase/supabase-js';
import { UserCreate } from "@/utils/types";

export const userCreate = async ({
  email,
  firstName,
  lastName,
  profileImageUrl,
  userId,
  role,
}: UserCreate) => {
  console.log("[USER_CREATE] Starting user creation:", {
    email,
    userId,
    role
  });

  if (!email || !userId) {
    throw new Error("Email and userId are required");
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
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
      console.error("[USER_CREATE] Database error:", error);
      throw error;
    }

    console.log("[USER_CREATE] User created successfully:", data);
    return data;
  } catch (error: any) {
    console.error("[USER_CREATE] Error creating user:", error);
    throw error;
  }
};
