"server only";
import { UserUpdate } from "@/utils/types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const userUpdate = async ({
  email,
  firstName,
  lastName,
  profileImageUrl,
  userId,
}: UserUpdate) => {
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
    console.log("[USER_UPDATE] Starting user update:", {
      email,
      firstName,
      lastName,
      userId,
    });

    const { data, error } = await supabase
      .from("User")
      .update({
        email,
        firstName,
        lastName,
        profileImageUrl,
        userId,
        updatedAt: new Date().toISOString(),
      })
      .eq("userId", userId)
      .select();

    if (error) {
      console.error("[USER_UPDATE] Error updating user:", error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    console.log("[USER_UPDATE] Successfully updated user:", data);
    return data;
  } catch (error: any) {
    console.error("[USER_UPDATE] Exception updating user:", error);
    throw new Error(`User update failed: ${error.message}`);
  }
};
