import { NextResponse } from "next/server";
import { ApiResponse } from "@/utils/types/api";
import { CoachProfileSchema, UpdateCoachProfileSchema, type CoachProfile } from "@/utils/types/coach";
import { ROLES, hasAnyRole } from "@/utils/roles/roles";
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
      console.error("[GET_COACH_PROFILE] Error:", error);
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error fetching coach profile'
        }
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<CoachProfile>>({ 
      data,
      error: null
    });
  } catch (error) {
    console.error("[GET_COACH_PROFILE] Error:", error);
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error processing request'
      }
    }, { status: 500 });
  }
});

export const POST = withApiAuth<CoachProfile>(async (req, { userUlid }) => {
  try {
    const body = await req.json();
    const validatedData = CoachProfileSchema.parse(body);
    const supabase = await createAuthClient();

    // Check if realtor profile exists
    const { data: realtorProfile } = await supabase
      .from("RealtorProfile")
      .select("ulid")
      .eq("userUlid", userUlid)
      .single();

    // Create realtor profile if it doesn't exist
    if (!realtorProfile) {
      const { error: profileError } = await supabase
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

      if (profileError) {
        console.error("[CREATE_COACH_PROFILE] Error creating realtor profile:", profileError);
        return NextResponse.json<ApiResponse<never>>({ 
          data: null,
          error: {
            code: 'CREATE_ERROR',
            message: 'Error creating realtor profile'
          }
        }, { status: 500 });
      }
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from("CoachProfile")
      .select("ulid")
      .eq("userUlid", userUlid)
      .single();

    if (existing) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'Coach profile already exists'
        }
      }, { status: 400 });
    }

    // Create new profile
    const { data, error } = await supabase
      .from("CoachProfile")
      .insert({
        ...validatedData,
        userUlid,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("[CREATE_COACH_PROFILE] Error:", error);
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Error creating coach profile'
        }
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<CoachProfile>>({ 
      data,
      error: null
    });
  } catch (error) {
    console.error("[CREATE_COACH_PROFILE] Error:", error);
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error processing request'
      }
    }, { status: 500 });
  }
}, { requiredRoles: [ROLES.COACH] });

export const PUT = withApiAuth<CoachProfile>(async (req, { userUlid }) => {
  try {
    const data = await req.json();
    console.log("[DEBUG] Starting updateCoachProfile with formData:", data);

    const supabase = await createAuthClient();

    // Get user and profile IDs
    const { data: user, error: userError } = await supabase
      .from("User")
      .select(`
        ulid,
        realtorProfile:RealtorProfile!inner(ulid)
      `)
      .eq("ulid", userUlid)
      .single();

    if (userError || !user?.realtorProfile?.[0]?.ulid) {
      console.error("[USER_FETCH_ERROR]", userError);
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Profile not found'
        }
      }, { status: 404 });
    }

    const validatedData = UpdateCoachProfileSchema.parse(data);

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
      console.error("[UPDATE_COACH_PROFILE] Error:", updateError);
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Error updating coach profile'
        }
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<CoachProfile>>({ 
      data: updatedProfile,
      error: null
    });
  } catch (error) {
    console.error("[UPDATE_COACH_PROFILE] Error:", error);
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error processing request'
      }
    }, { status: 500 });
  }
}); 