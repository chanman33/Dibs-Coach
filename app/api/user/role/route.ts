import { getUserRole } from "@/utils/roles/checkUserRole";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const role = await getUserRole(userId);
    return NextResponse.json({ role });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching user role" },
      { status: 500 }
    );
  }
} 