import { NextRequest, NextResponse } from "next/server";
import { ensureUserExists } from "@/utils/auth";
import { getUserRoleContext } from "@/utils/roles/checkUserRole";
import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "@/utils/auth";
import { SYSTEM_ROLES, USER_CAPABILITIES } from "@/utils/roles/roles";
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
    
    // Type guard function
    const hasIdentifier = (user: any): user is { ulid: string } | { id: number } => {
      return 'ulid' in user || 'id' in user;
    };

    if (!hasIdentifier(user)) {
      console.error("[GET_USER_ROLES] Error ensuring user exists");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userIdentifier = 'ulid' in user ? user.ulid : user.id;

    const roleContext = await getUserRoleContext(userId, { isInitialSignup });
    
    if (!roleContext) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }
    
    return NextResponse.json({ 
      exists: true, 
      roleData: {
        systemRole: roleContext.systemRole,
        capabilities: roleContext.capabilities
      }
    });
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
    const { systemRole, capabilities } = body;

    // Validate system role
    if (!Object.values(SYSTEM_ROLES).includes(systemRole)) {
      return NextResponse.json(
        { error: "Invalid system role provided" },
        { status: 400 }
      );
    }

    // Validate capabilities
    if (!Array.isArray(capabilities) || 
        !capabilities.every(c => Object.values(USER_CAPABILITIES).includes(c))) {
      return NextResponse.json(
        { error: "Invalid capabilities provided" },
        { status: 400 }
      );
    }

    // Get or create user in database
    const user = await ensureUserExists();
    
    // Type guard function
    const hasIdentifier = (user: any): user is { ulid: string } | { id: number } => {
      return 'ulid' in user || 'id' in user;
    };

    if (!hasIdentifier(user)) {
      console.error("[UPDATE_USER_ROLES] Error ensuring user exists");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userIdentifier = 'ulid' in user ? user.ulid : user.id;

    const supabase = createAuthClient();

    // Update user roles using ULID
    const { error: updateError } = await supabase
      .from("User")
      .update({ 
        systemRole,
        capabilities,
        updatedAt: new Date().toISOString()
      })
      .eq("ulid", userIdentifier);

    if (updateError) {
      console.error("[UPDATE_USER_ROLES] Error:", updateError);
      return NextResponse.json(
        { error: "Error updating user roles" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      systemRole,
      capabilities
    });
  } catch (error) {
    console.error("[UPDATE_USER_ROLES] Error:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
} 