import { getUserRoles } from "@/utils/roles/checkUserRole";
import { validateRoles } from "@/utils/roles/roles";
import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";
import { ensureUserExists } from "@/utils/auth";
import type { Database } from "@/types/supabase";

type UserRecord = Database["public"]["Tables"]["User"]["Row"];

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const isInitialSignup = req.nextUrl.searchParams.get("isInitialSignup") === "true";

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Get or create user in database
    const user = await ensureUserExists();
    
    if (!user?.ulid) {
      console.error("[GET_USER_ROLES] Error ensuring user exists");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roles = await getUserRoles(user.ulid, { isInitialSignup });
    
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

    // Get or create user in database
    const user = await ensureUserExists();
    
    if (!user?.ulid) {
      console.error("[UPDATE_USER_ROLES] Error ensuring user exists");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabase = createAuthClient();

    // Update user roles using ULID
    const { error: updateError } = await supabase
      .from("User")
      .update({ role: validatedRoles })
      .eq("ulid", user.ulid);

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