import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  SessionSchema,
  CreateSessionSchema,
  UpdateSessionSchema,
  SessionRateSchema,
} from "@/utils/types/session";
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

// Helper function to calculate session rate
async function calculateSessionRate(coachDbId: number, durationMinutes: number) {
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

  const { data: coach } = await supabase
    .from("CoachProfile")
    .select("hourlyRate")
    .eq("userDbId", coachDbId)
    .single();

  if (!coach?.hourlyRate) return null;

  return {
    baseRate: Number(coach.hourlyRate),
    amount: (Number(coach.hourlyRate) / 60) * durationMinutes,
    currency: "USD",
  };
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

    // Get user's roles to determine which sessions to fetch
    const roles = await getUserRoles(userId);
    const isCoach = hasAnyRole(roles, [ROLES.COACH]);
    const isMentee = hasAnyRole(roles, [ROLES.MENTEE]);

    let query = supabase
      .from("Session")
      .select(`
        *,
        coach:coachDbId(id, firstName, lastName, email),
        mentee:menteeDbId(id, firstName, lastName, email),
        payment:payment(id, amount, currency, status)
      `);

    // Filter based on role
    if (isCoach && !isMentee) {
      query = query.eq("coachDbId", userDbId);
    } else if (!isCoach && isMentee) {
      query = query.eq("menteeDbId", userDbId);
    } else {
      query = query.or(`coachDbId.eq.${userDbId},menteeDbId.eq.${userDbId}`);
    }

    const { data, error } = await query.order("startTime", { ascending: false });

    if (error) {
      console.error("[GET_SESSIONS] Error:", error);
      return NextResponse.json(
        { error: "Error fetching sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET_SESSIONS] Error:", error);
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

  try {
    const body = await req.json();
    const validatedData = CreateSessionSchema.parse(body);
    const userDbId = await getUserDbId(userId);

    // Verify user is either the coach or mentee
    if (userDbId !== validatedData.coachDbId && userDbId !== validatedData.menteeDbId) {
      return NextResponse.json(
        { error: "Unauthorized to create this session" },
        { status: 403 }
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

    // Calculate session rate
    const rate = await calculateSessionRate(
      validatedData.coachDbId,
      validatedData.durationMinutes
    );

    // Create session and payment in a transaction
    const { data: session, error } = await supabase
      .from("Session")
      .insert({
        ...validatedData,
        status: "scheduled",
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        coach:coachDbId(id, firstName, lastName, email),
        mentee:menteeDbId(id, firstName, lastName, email)
      `)
      .single();

    if (error) {
      console.error("[CREATE_SESSION] Error:", error);
      return NextResponse.json(
        { error: "Error creating session" },
        { status: 500 }
      );
    }

    // Create payment if rate exists
    if (rate) {
      const { error: paymentError } = await supabase.from("Payment").insert({
        sessionId: session.id,
        payerDbId: validatedData.menteeDbId,
        payeeDbId: validatedData.coachDbId,
        amount: rate.amount,
        currency: rate.currency,
        status: "pending",
      });

      if (paymentError) {
        console.error("[CREATE_PAYMENT] Error:", paymentError);
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json({ data: session });
  } catch (error) {
    console.error("[CREATE_SESSION] Error:", error);
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

  try {
    const body = await req.json();
    const validatedData = UpdateSessionSchema.parse(body);
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

    // Verify session ownership
    const { data: existing } = await supabase
      .from("Session")
      .select("coachDbId, menteeDbId")
      .eq("id", validatedData.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (userDbId !== existing.coachDbId && userDbId !== existing.menteeDbId) {
      return NextResponse.json(
        { error: "Unauthorized to update this session" },
        { status: 403 }
      );
    }

    // Update session
    const { data, error } = await supabase
      .from("Session")
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", validatedData.id)
      .select(`
        *,
        coach:coachDbId(id, firstName, lastName, email),
        mentee:menteeDbId(id, firstName, lastName, email),
        payment:payment(id, amount, currency, status)
      `)
      .single();

    if (error) {
      console.error("[UPDATE_SESSION] Error:", error);
      return NextResponse.json(
        { error: "Error updating session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[UPDATE_SESSION] Error:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
} 