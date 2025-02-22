import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "@/utils/auth";
import { z } from "zod";
import { SYSTEM_ROLES } from "@/utils/roles/roles";
import { ulidSchema } from "@/utils/types/auth";

// Input validation schema
const updateRoleSchema = z.object({
  userUlid: ulidSchema,
  role: z.enum([SYSTEM_ROLES.SYSTEM_OWNER, SYSTEM_ROLES.SYSTEM_MODERATOR]),
});

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get authenticated Supabase client
    const supabase = await createAuthClient();

    // Get admin's ULID and check role
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from("User")
      .select("ulid, systemRole")
      .eq("userId", session.userId)
      .single();

    if (adminCheckError) {
      console.error("[ADMIN_CHECK_ERROR]", { userId: session.userId, error: adminCheckError });
      return new NextResponse("Error checking admin status", { status: 500 });
    }

    if (!adminCheck || adminCheck.systemRole !== SYSTEM_ROLES.SYSTEM_OWNER) {
      return new NextResponse("Forbidden: System owner access required", { status: 403 });
    }

    // Parse and validate request body
    let validatedData: z.infer<typeof updateRoleSchema>;
    try {
      const body = await req.json();
      validatedData = updateRoleSchema.parse(body);
    } catch (error) {
      console.error("[VALIDATION_ERROR]", { adminUlid: adminCheck.ulid, error });
      return new NextResponse(
        error instanceof z.ZodError
          ? "Invalid request data: " + error.errors[0].message
          : "Invalid request data",
        { status: 400 }
      );
    }

    // Get user's current data before updating role
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("email, systemRole, userId, ulid")
      .eq("ulid", validatedData.userUlid)
      .single();

    if (userError) {
      console.error("[USER_FETCH_ERROR]", { 
        adminUlid: adminCheck.ulid, 
        targetUlid: validatedData.userUlid,
        error: userError 
      });
      return new NextResponse("Error fetching user data", { status: 500 });
    }

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Validate admin role assignment
    if (
      (validatedData.role === SYSTEM_ROLES.SYSTEM_OWNER || validatedData.role === SYSTEM_ROLES.SYSTEM_MODERATOR) &&
      !user.email.endsWith("@wedibs.com") &&
      !user.email.endsWith("@dibs.coach")
    ) {
      return new NextResponse(
        "System owner and moderator roles can only be assigned to @wedibs.com or @dibs.coach email addresses",
        { status: 400 }
      );
    }

    // Prevent self-role change
    if (user.ulid === adminCheck.ulid) {
      return new NextResponse(
        "You cannot change your own role",
        { status: 400 }
      );
    }

    // Update user role
    const { error: updateError } = await supabase
      .from("User")
      .update({ 
        systemRole: validatedData.role,
        updatedAt: new Date().toISOString()
      })
      .eq("ulid", validatedData.userUlid);

    if (updateError) {
      console.error("[UPDATE_ROLE_ERROR]", { 
        adminUlid: adminCheck.ulid,
        targetUlid: validatedData.userUlid,
        error: updateError 
      });
      return new NextResponse("Failed to update role", { status: 500 });
    }

    // Log the role change in admin audit log
    const { error: auditError } = await supabase.from("AdminAuditLog").insert({
      adminUlid: adminCheck.ulid,
      action: "UPDATE_ROLE",
      targetType: "user",
      targetUlid: validatedData.userUlid,
      details: {
        oldRole: user.systemRole,
        newRole: validatedData.role,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    });

    if (auditError) {
      console.error("[AUDIT_LOG_ERROR]", { 
        adminUlid: adminCheck.ulid,
        targetUlid: validatedData.userUlid,
        error: auditError 
      });
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully updated user role from ${user.systemRole} to ${validatedData.role}`
    });
  } catch (error) {
    console.error("[UPDATE_ROLE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 