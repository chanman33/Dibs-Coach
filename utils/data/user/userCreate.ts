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

  try {
    // console.log("Attempting to create user:", {
    //   email,
    //   firstName: first_name,
    //   lastName: last_name,
    //   profileImageUrl: profile_image_url,
    //   userId: user_id,
    //   role,
    // });

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
      console.error("Error creating user:", error);
      return error;
    }
    return data;
  } catch (error: any) {
    console.error("Exception creating user:", error);
    throw new Error(error.message);
  }
};
