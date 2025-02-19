import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "@/utils/auth";
import { SYSTEM_ROLES } from "@/utils/roles/roles";

export async function GET() {
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

    // Fetch all users with their roles
    const { data: users, error } = await supabase
      .from("User")
      .select(`
        ulid,
        userId,
        email,
        firstName,
        lastName,
        systemRole,
        status,
        createdAt,
        updatedAt
      `)
      .order("email");

    if (error) {
      console.error("[FETCH_USERS_ERROR]", { adminUlid: adminCheck.ulid, error });
      return new NextResponse("Failed to fetch users", { status: 500 });
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("[FETCH_USERS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 