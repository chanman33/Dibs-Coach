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

    // Check if profile already exists, explicitly type the result to include 'id'
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

    // 1. Update CoachProfile
    const coachProfileData = {
      userDbId: user.id,
      coachingSpecialties: data.specialties,
      yearsCoaching: data.yearsCoaching,
      hourlyRate: data.hourlyRate,
      calendlyUrl: data.calendlyUrl || "",
      eventTypeUrl: data.eventTypeUrl || "",
      defaultDuration: data.defaultDuration,
      minimumDuration: data.minimumDuration,
      maximumDuration: data.maximumDuration,
      allowCustomDuration: data.allowCustomDuration,
      updatedAt: new Date().toISOString()
    };

    const { error: coachError } = await supabase
      .from("CoachProfile")
      .update(coachProfileData)
      .eq("userDbId", user.id);

    if (coachError) {
      console.error("[COACH_PROFILE_UPDATE_ERROR]", coachError);
      throw coachError;
    }

    // 2. Update RealtorProfile
    const realtorProfileData = {
      languages: data.languages || [],
      bio: data.marketExpertise || null,
      certifications: data.certifications || [],
      propertyTypes: data.propertyTypes || [],
      specializations: data.specializations || [],
      marketingAreas: data.marketingAreas || [],
      testimonials: data.testimonials || [],
      geographicFocus: data.geographicFocus || { cities: [], counties: [], neighborhoods: [] },
      updatedAt: new Date().toISOString()
    };

    const { error: realtorError } = await supabase
      .from("RealtorProfile")
      .update(realtorProfileData)
      .eq("id", realtorProfileId);

    if (realtorError) {
      console.error("[DEBUG] Error updating realtor profile:", realtorError);
      throw realtorError;
    }

    // 3. Handle Professional Recognitions
    if (data.professionalRecognitions && !data.archivedRecognitionId) {
      // First delete existing non-archived recognitions
      const { error: deleteError } = await supabase
        .from("ProfessionalRecognition")
        .delete()
        .eq("realtorProfileId", realtorProfileId)
        .is("archivedAt", null);

      if (deleteError) {
        console.error("[DELETE_RECOGNITIONS_ERROR]", deleteError);
        throw deleteError;
      }

      // Then insert new recognitions if any exist
      if (Array.isArray(data.professionalRecognitions) && data.professionalRecognitions.length > 0) {
        const recognitionsToInsert = data.professionalRecognitions.map((recognition: any) => ({
          realtorProfileId: realtorProfileId,
          title: recognition.title,
          type: recognition.type,
          year: recognition.year,
          organization: recognition.organization || null,
          description: recognition.description || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from("ProfessionalRecognition")
          .insert(recognitionsToInsert);

        if (insertError) {
          console.error("[INSERT_RECOGNITIONS_ERROR]", insertError);
          throw insertError;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROFILE_UPDATE_ERROR]", error);
    return new NextResponse(JSON.stringify(error), { status: 500 });
  }
} 