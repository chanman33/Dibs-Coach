import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "@/utils/auth";

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get authenticated Supabase client
    const supabase = await createAuthClient();

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from("User")
      .select("role")
      .eq("userId", session.userId)
      .single();

    if (!adminCheck || adminCheck.role !== "ADMIN") {
      return new NextResponse("Forbidden: Admin access required", { status: 403 });
    }

    // Fetch all users with their roles
    const { data: users, error } = await supabase
      .from("User")
      .select("id, email, firstName, lastName, role, status")
      .order("email");

    if (error) {
      console.error("[FETCH_USERS_ERROR]", error);
      return new NextResponse("Failed to fetch users", { status: 500 });
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("[FETCH_USERS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 