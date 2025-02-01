import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { CoachProfileSchema, UpdateCoachProfileSchema } from "@/utils/types/coach";
import { ROLES, hasAnyRole } from "@/utils/roles/roles";
import { getUserRoles } from "@/utils/roles/checkUserRole";

// Helper function to get user's database ID
async function getUserDbId(userId: string) {
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

  const { data, error } = await supabase
    .from("User")
    .select("id")
    .eq("userId", userId)
    .single();

  if (error) throw error;
  return data.id;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userDbId = await getUserDbId(userId);
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

    const { data, error } = await supabase
      .from("CoachProfile")
      .select("*")
      .eq("userDbId", userDbId)
      .single();

    if (error) {
      console.error("[GET_COACH_PROFILE] Error:", error);
      return NextResponse.json(
        { error: "Error fetching coach profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET_COACH_PROFILE] Error:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is a coach
  const roles = await getUserRoles(userId);
  if (!hasAnyRole(roles, [ROLES.COACH])) {
    return NextResponse.json(
      { error: "Only coaches can create profiles" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validatedData = CoachProfileSchema.parse(body);
    const userDbId = await getUserDbId(userId);

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

    // Check if profile already exists
    const { data: existing } = await supabase
      .from("CoachProfile")
      .select("id")
      .eq("userDbId", userDbId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Coach profile already exists" },
        { status: 400 }
      );
    }

    // Create new profile
    const { data, error } = await supabase
      .from("CoachProfile")
      .insert({
        ...validatedData,
        userDbId,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[CREATE_COACH_PROFILE] Error:", error);
      return NextResponse.json(
        { error: "Error creating coach profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[CREATE_COACH_PROFILE] Error:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is a coach
  const roles = await getUserRoles(userId);
  if (!hasAnyRole(roles, [ROLES.COACH])) {
    return NextResponse.json(
      { error: "Only coaches can update profiles" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validatedData = UpdateCoachProfileSchema.parse(body);
    const userDbId = await getUserDbId(userId);

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

    // Verify ownership
    const { data: existing } = await supabase
      .from("CoachProfile")
      .select("id")
      .eq("userDbId", userDbId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    // Update profile
    const { data, error } = await supabase
      .from("CoachProfile")
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .eq("userDbId", userDbId)
      .select()
      .single();

    if (error) {
      console.error("[UPDATE_COACH_PROFILE] Error:", error);
      return NextResponse.json(
        { error: "Error updating coach profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[UPDATE_COACH_PROFILE] Error:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
} 