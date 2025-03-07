import { NextRequest, NextResponse } from "next/server";
import { createUserIfNotExists } from "@/utils/auth";
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
    const user = await createUserIfNotExists(userId);
    
    // Get user role context
    const roleContext = await getUserRoleContext(userId, { isInitialSignup });
    if (!roleContext) {
      return NextResponse.json({ error: "Role context not found" }, { status: 404 });
    }

    return NextResponse.json({
      systemRole: roleContext.systemRole,
      capabilities: roleContext.capabilities,
    });
  } catch (error) {
    console.error("[GET_USER_ROLES] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { role, capability, action } = body;

    if (!role && !capability) {
      return NextResponse.json(
        { error: "Either role or capability is required" },
        { status: 400 }
      );
    }

    if (!action || !["add", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action (add/remove) is required" },
        { status: 400 }
      );
    }

    // Get or create user in database
    const user = await createUserIfNotExists(userId);
    
    const supabase = createAuthClient();

    // Update user role or capability
    if (role) {
      // Validate role
      if (!Object.values(SYSTEM_ROLES).includes(role)) {
        return NextResponse.json(
          { error: `Invalid role: ${role}` },
          { status: 400 }
        );
      }

      // Update role
      const { error: updateError } = await supabase
        .from("User")
        .update({
          systemRole: role,
          updatedAt: new Date().toISOString(),
        })
        .eq("userId", userId);

      if (updateError) {
        console.error("[UPDATE_USER_ROLE] Error:", updateError);
        return NextResponse.json(
          { error: "Failed to update role" },
          { status: 500 }
        );
      }
    }

    if (capability) {
      // Validate capability
      if (!Object.values(USER_CAPABILITIES).includes(capability)) {
        return NextResponse.json(
          { error: `Invalid capability: ${capability}` },
          { status: 400 }
        );
      }

      // Get current capabilities
      const { data: userData, error: fetchError } = await supabase
        .from("User")
        .select("capabilities")
        .eq("userId", userId)
        .single();

      if (fetchError) {
        console.error("[UPDATE_USER_CAPABILITY] Error fetching user:", fetchError);
        return NextResponse.json(
          { error: "Failed to fetch user capabilities" },
          { status: 500 }
        );
      }

      // Update capabilities
      let capabilities = Array.isArray(userData.capabilities)
        ? [...userData.capabilities]
        : [];

      if (action === "add" && !capabilities.includes(capability)) {
        capabilities.push(capability);
      } else if (action === "remove") {
        capabilities = capabilities.filter((c) => c !== capability);
      }

      const { error: updateError } = await supabase
        .from("User")
        .update({
          capabilities,
          updatedAt: new Date().toISOString(),
        })
        .eq("userId", userId);

      if (updateError) {
        console.error("[UPDATE_USER_CAPABILITY] Error:", updateError);
        return NextResponse.json(
          { error: "Failed to update capability" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UPDATE_USER_ROLE] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 