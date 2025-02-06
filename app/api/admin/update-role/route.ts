import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "@/utils/auth";
import { z } from "zod";

// Input validation schema
const updateRoleSchema = z.object({
  userId: z.number(),
  role: z.enum(["MENTEE", "COACH", "ADMIN"]),
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

    // Check if user is admin
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from("User")
      .select("role")
      .eq("userId", session.userId)
      .single();

    if (adminCheckError) {
      console.error("[ADMIN_CHECK_ERROR]", adminCheckError);
      return new NextResponse("Error checking admin status", { status: 500 });
    }

    if (!adminCheck || adminCheck.role !== "ADMIN") {
      return new NextResponse("Forbidden: Admin access required", { status: 403 });
    }

    // Parse and validate request body
    let validatedData: z.infer<typeof updateRoleSchema>;
    try {
      const body = await req.json();
      validatedData = updateRoleSchema.parse(body);
    } catch (error) {
      console.error("[VALIDATION_ERROR]", error);
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
      .select("email, role, userId")
      .eq("id", validatedData.userId)
      .single();

    if (userError) {
      console.error("[USER_FETCH_ERROR]", userError);
      return new NextResponse("Error fetching user data", { status: 500 });
    }

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Validate admin role assignment
    if (
      validatedData.role === "ADMIN" &&
      !user.email.endsWith("@wedibs.com") &&
      !user.email.endsWith("@dibs.coach")
    ) {
      return new NextResponse(
        "Admin role can only be assigned to @wedibs.com or @dibs.coach email addresses",
        { status: 400 }
      );
    }

    // Prevent self-role change
    if (user.userId === session.userId) {
      return new NextResponse(
        "You cannot change your own role",
        { status: 400 }
      );
    }

    // Update user role
    const { error: updateError } = await supabase
      .from("User")
      .update({ 
        role: validatedData.role,
        updatedAt: new Date().toISOString()
      })
      .eq("id", validatedData.userId);

    if (updateError) {
      console.error("[UPDATE_ROLE_ERROR]", updateError);
      return new NextResponse("Failed to update role", { status: 500 });
    }

    // Log the role change in admin audit log
    const { error: auditError } = await supabase.from("AdminAuditLog").insert({
      adminId: session.userId,
      action: "UPDATE_ROLE",
      details: {
        userId: validatedData.userId,
        oldRole: user.role,
        newRole: validatedData.role,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    });

    if (auditError) {
      console.error("[AUDIT_LOG_ERROR]", auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully updated user role from ${user.role} to ${validatedData.role}`
    });
  } catch (error) {
    console.error("[UPDATE_ROLE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 