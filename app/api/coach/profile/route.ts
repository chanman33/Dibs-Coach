import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { CoachProfileSchema, UpdateCoachProfileSchema } from "@/utils/types/coach";
import { ROLES, hasAnyRole } from "@/utils/roles/roles";
import { getUserRoles } from "@/utils/roles/checkUserRole";
import { ProfessionalRecognition, ProfessionalRecognitionSchema } from "@/utils/types/realtor";

// At the top of the file, add the interface for form data
interface FormRecognition {
  title: string;
  type: "AWARD" | "ACHIEVEMENT";
  year: number;
  organization?: string;
  description?: string;
}

// Helper function to get user's database ID
async function getUserDbId(userId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { 
      cookies: {
        get: async function(name: string) {
          const cookies = await cookieStore;
          return cookies.get(name)?.value;
        },
      },
    },
  );

  const { data, error } = await supabase
    .from("User")
    .select("id")
    .eq("userId", userId)
    .single<{ id: number }>();

  if (error) throw error;
  return data.id;
}

async function getCookie(name: string) {
  const store = await cookies();
  return store.get(name)?.value;
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
          get: async function(name: string) {
            const cookies = await cookieStore;
            return cookies.get(name)?.value;
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
  const authResult = await auth();
  const userId = authResult.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is a coach
  const roles = await getUserRoles(userId);
  if (!roles || !hasAnyRole(roles, [ROLES.COACH])) {
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
          get: async function(name: string) {
            const cookies = await cookieStore;
            return cookies.get(name)?.value;
          },
        },
      }
    );

    // Check if realtor profile exists
    const { data: realtorProfile } = await supabase
      .from("RealtorProfile")
      .select("id")
      .eq("userDbId", userDbId)
      .single();

    // Create realtor profile if it doesn't exist
    if (!realtorProfile) {
      const { error: profileError } = await supabase
        .from("RealtorProfile")
        .insert({
          userDbId,
          bio: '',
          yearsExperience: 0,
          propertyTypes: [],
          specializations: [],
          certifications: [],
          languages: [],
          geographicFocus: {},
          marketingAreas: [],
          testimonials: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      if (profileError) {
        console.error("[CREATE_COACH_PROFILE] Error creating realtor profile:", profileError);
        return NextResponse.json(
          { error: "Error creating realtor profile" },
          { status: 500 }
        );
      }
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from("CoachProfile")
      .select("id")
      .eq("userDbId", userDbId)
      .single<{ id: number }>();

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
  try {
    const authResult = await auth();
    const userId = authResult.userId;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.json();
    console.log("[DEBUG] Starting updateCoachProfile with formData:", data);

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get: async function(name: string) {
            const cookies = await cookieStore;
            return cookies.get(name)?.value;
          },
        },
      }
    );

    // Get user and profile IDs
    const { data: user, error: userError } = await supabase
      .from("User")
      .select(`
        id,
        realtorProfile:RealtorProfile!inner(id)
      `)
      .eq("userId", userId)
      .single();

    if (userError || !user?.realtorProfile?.[0]?.id) {
      console.error("[USER_FETCH_ERROR]", userError);
      return new NextResponse("Profile not found", { status: 404 });
    }

    const realtorProfileId = user.realtorProfile[0].id;

    // Handle soft delete if a recognition is being archived
    if (data.archivedRecognitionId) {
      const { error: archiveError } = await supabase
        .from("ProfessionalRecognition")
        .update({ 
          archivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq("id", data.archivedRecognitionId)
        .eq("realtorProfileId", realtorProfileId);

      if (archiveError) {
        console.error("[ARCHIVE_RECOGNITION_ERROR]", archiveError);
        throw archiveError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROFILE_UPDATE_ERROR]", error);
    return new NextResponse(JSON.stringify(error), { status: 500 });
  }
} 