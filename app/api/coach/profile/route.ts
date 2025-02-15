import { NextResponse } from "next/server";
import { ApiResponse } from "@/utils/types/api";
import { CoachProfileSchema, UpdateCoachProfileSchema, type CoachProfile } from "@/utils/types/coach";
import { ROLES } from "@/utils/roles/roles";
import { withApiAuth } from "@/utils/middleware/withApiAuth";
import { createAuthClient } from "@/utils/auth";
import { ProfessionalRecognition, ProfessionalRecognitionSchema } from "@/utils/types/realtor";

// At the top of the file, add the interface for form data
interface FormRecognition {
  title: string;
  type: "AWARD" | "ACHIEVEMENT";
  year: number;
  organization?: string;
  description?: string;
}

export const GET = withApiAuth<CoachProfile>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient();

    const { data, error } = await supabase
      .from("CoachProfile")
      .select("*")
      .eq("userUlid", userUlid)
      .single();

    if (error) {
      console.error("[COACH_PROFILE_ERROR] Failed to fetch profile:", { userUlid, error });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch coach profile'
        }
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Coach profile not found'
        }
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<CoachProfile>>({ 
      data,
      error: null
    });
  } catch (error) {
    console.error("[COACH_PROFILE_ERROR] Unexpected error:", { userUlid, error });
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
}, { requiredRoles: [ROLES.COACH] });

export const POST = withApiAuth<CoachProfile>(async (req, { userUlid }) => {
  const supabase = await createAuthClient();
  
  try {
    const body = await req.json();
    const validatedData = CoachProfileSchema.parse(body);

    // Start transaction
    const { data: existingProfile, error: checkError } = await supabase
      .from("CoachProfile")
      .select("ulid")
      .eq("userUlid", userUlid)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("[COACH_PROFILE_ERROR] Failed to check existing profile:", { userUlid, error: checkError });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'DB_ERROR',
          message: 'Failed to check existing profile'
        }
      }, { status: 500 });
    }

    if (existingProfile) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'Coach profile already exists'
        }
      }, { status: 400 });
    }

    // Create realtor profile if it doesn't exist
    const { data: realtorProfile, error: realtorError } = await supabase
      .from("RealtorProfile")
      .select("ulid")
      .eq("userUlid", userUlid)
      .single();

    if (!realtorProfile) {
      const { error: createError } = await supabase
        .from("RealtorProfile")
        .insert({
          userUlid,
          bio: '',
          yearsExperience: 0,
          propertyTypes: [],
          specializations: [],
          certifications: [],
          languages: [],
          geographicFocus: {},
          marketingAreas: [],
          testimonials: {},
          updatedAt: new Date().toISOString()
        });

      if (createError) {
        console.error("[COACH_PROFILE_ERROR] Failed to create realtor profile:", { userUlid, error: createError });
        return NextResponse.json<ApiResponse<never>>({ 
          data: null,
          error: {
            code: 'CREATE_ERROR',
            message: 'Failed to create realtor profile'
          }
        }, { status: 500 });
      }
    }

    // Create coach profile
    const { data: profile, error: createError } = await supabase
      .from("CoachProfile")
      .insert({
        ...validatedData,
        userUlid,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error("[COACH_PROFILE_ERROR] Failed to create coach profile:", { userUlid, error: createError });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create coach profile'
        }
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<CoachProfile>>({ 
      data: profile,
      error: null
    });
  } catch (error) {
    console.error("[COACH_PROFILE_ERROR] Unexpected error:", { userUlid, error });
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
}, { requiredRoles: [ROLES.COACH] });

export const PUT = withApiAuth<CoachProfile>(async (req, { userUlid }) => {
  const supabase = await createAuthClient();
  
  try {
    const data = await req.json();
    const validatedData = UpdateCoachProfileSchema.parse(data);

    // Get user and profile IDs
    const { data: profiles, error: profileError } = await supabase
      .from("User")
      .select(`
        ulid,
        realtorProfile:RealtorProfile!inner(ulid),
        coachProfile:CoachProfile!inner(ulid)
      `)
      .eq("ulid", userUlid)
      .single();

    if (profileError || !profiles?.coachProfile?.[0]?.ulid) {
      console.error("[COACH_PROFILE_ERROR] Failed to fetch profiles:", { userUlid, error: profileError });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Coach profile not found'
        }
      }, { status: 404 });
    }

    // Update coach profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("CoachProfile")
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .eq("userUlid", userUlid)
      .select()
      .single();

    if (updateError) {
      console.error("[COACH_PROFILE_ERROR] Failed to update profile:", { userUlid, error: updateError });
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update coach profile'
        }
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<CoachProfile>>({ 
      data: updatedProfile,
      error: null
    });
  } catch (error) {
    console.error("[COACH_PROFILE_ERROR] Unexpected error:", { userUlid, error });
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
}, { requiredRoles: [ROLES.COACH] }); 