import { NextResponse } from "next/server"
import { ApiResponse } from "@/utils/types/api"
import { withApiAuth } from "@/utils/middleware/withApiAuth"
import { createAuthClient } from "@/utils/auth"
import { z } from "zod"

// Validation schemas
const MarketingDataSchema = z.object({
  slogan: z.string().optional().nullable(),
  websiteUrl: z.string().url("Invalid website URL").optional().nullable(),
  facebookUrl: z.string().url("Invalid Facebook URL").optional().nullable(),
  instagramUrl: z.string().url("Invalid Instagram URL").optional().nullable(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().nullable(),
  youtubeUrl: z.string().url("Invalid YouTube URL").optional().nullable(),
  marketingAreas: z.array(z.string()).default([]),
  testimonials: z.record(z.any()).optional().nullable()
})

type MarketingData = z.infer<typeof MarketingDataSchema>

export const GET = withApiAuth<MarketingData>(async (req, { userUlid }) => {
  try {
    const supabase = await createAuthClient()

    // Get marketing information from realtor profile
    const { data: marketingData, error: marketingError } = await supabase
      .from("RealtorProfile")
      .select(`
        slogan,
        websiteUrl,
        facebookUrl,
        instagramUrl,
        linkedinUrl,
        youtubeUrl,
        marketingAreas,
        testimonials
      `)
      .eq("userUlid", userUlid)
      .single()

    if (marketingError) {
      console.error("[MARKETING_ERROR]", { userUlid, error: marketingError })
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch marketing information'
        }
      }, { status: 500 })
    }

    // Validate the data
    const validationResult = MarketingDataSchema.safeParse(marketingData)
    if (!validationResult.success) {
      console.error("[MARKETING_ERROR] Invalid data format:", validationResult.error)
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid marketing data format',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    return NextResponse.json<ApiResponse<MarketingData>>({ 
      data: validationResult.data,
      error: null
    })
  } catch (error) {
    console.error("[MARKETING_ERROR]", error)
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
})

export const PUT = withApiAuth<MarketingData>(async (req, { userUlid }) => {
  try {
    const body = await req.json()

    // Validate request body
    const validationResult = MarketingDataSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid marketing data',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const supabase = await createAuthClient()

    // Update marketing information
    const { data: updatedData, error: updateError } = await supabase
      .from("RealtorProfile")
      .update({
        ...validationResult.data,
        updatedAt: new Date().toISOString()
      })
      .eq("userUlid", userUlid)
      .select()
      .single()

    if (updateError) {
      console.error("[MARKETING_ERROR]", { userUlid, error: updateError })
      return NextResponse.json<ApiResponse<never>>({ 
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update marketing information'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<MarketingData>>({ 
      data: validationResult.data,
      error: null
    })
  } catch (error) {
    console.error("[MARKETING_ERROR]", error)
    return NextResponse.json<ApiResponse<never>>({ 
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}) 