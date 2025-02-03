import { getUserRoles } from "@/utils/roles/checkUserRole";
import { validateRoles } from "@/utils/roles/roles";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const isInitialSignup = req.nextUrl.searchParams.get("isInitialSignup") === "true";

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const roles = await getUserRoles(userId, { isInitialSignup });
    
    // If roles is null, it means user doesn't exist
    if (!roles) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }
    
    return NextResponse.json({ exists: true, roles });
  } catch (error) {
    console.error("[GET_USER_ROLES] Error:", error);
    return NextResponse.json(
      { error: "Error fetching user roles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { roles: newRoles } = body;

    if (!Array.isArray(newRoles)) {
      return NextResponse.json(
        { error: "Roles must be an array" },
        { status: 400 }
      );
    }

    // Validate roles
    let validatedRoles;
    try {
      validatedRoles = validateRoles(newRoles);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid roles provided" },
        { status: 400 }
      );
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

    // Update user roles
    const { error: updateError } = await supabase
      .from("User")
      .update({ role: validatedRoles })
      .eq("userId", userId);

    if (updateError) {
      console.error("[UPDATE_USER_ROLES] Error:", updateError);
      return NextResponse.json(
        { error: "Error updating user roles" },
        { status: 500 }
      );
    }

    return NextResponse.json({ roles: validatedRoles });
  } catch (error) {
    console.error("[UPDATE_USER_ROLES] Error:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
} 