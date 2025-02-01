import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for RESO member fields
const ResoMemberSchema = z.object({
  memberKey: z.string().optional(),
  memberStatus: z.string(),
  designations: z.array(z.string()),
  licenseNumber: z.string().optional(),
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  try {
    const { data, error } = await supabase
      .from("User")
      .select(`
        memberKey,
        memberStatus,
        designations,
        licenseNumber,
        companyName,
        phoneNumber
      `)
      .eq("userId", userId)
      .single();

    if (error) {
      console.error("[GET_RESO_MEMBER] Error:", error);
      return NextResponse.json(
        { error: "Error fetching RESO member data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET_RESO_MEMBER] Error:", error);
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
    
    // Validate request body
    const validatedData = ResoMemberSchema.parse(body);

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

    // Check for unique constraints
    if (validatedData.memberKey || validatedData.licenseNumber) {
      const { data: existing } = await supabase
        .from("User")
        .select("id")
        .or(`memberKey.eq.${validatedData.memberKey},licenseNumber.eq.${validatedData.licenseNumber}`)
        .neq("userId", userId)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Member key or license number already exists" },
          { status: 400 }
        );
      }
    }

    // Update user RESO member data
    const { error: updateError } = await supabase
      .from("User")
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .eq("userId", userId);

    if (updateError) {
      console.error("[UPDATE_RESO_MEMBER] Error:", updateError);
      return NextResponse.json(
        { error: "Error updating RESO member data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: validatedData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data format", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[UPDATE_RESO_MEMBER] Error:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
} 