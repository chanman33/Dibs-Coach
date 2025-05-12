import { NextResponse } from "next/server"
import { ApiResponse } from "@/utils/types/api"
import { withApiAuth } from "@/utils/middleware/withApiAuth"
import { createAuthClient } from "@/utils/auth"
import { listingBaseSchema } from "@/utils/types/listing"
import { revalidatePath } from "next/cache"
import { ulidSchema } from "@/utils/types/auth"
import { z } from "zod"

// Validation schema for listing ID
const ListingParamsSchema = z.object({
  id: ulidSchema
})

// GET /api/listings/[id] - Get a specific listing
export const GET = withApiAuth(async (request: Request, ctx) => {
  const { userUlid } = ctx
  const id = request.url.split('/').slice(-1)[0]

  try {
    // Validate listing ID
    const validationResult = ListingParamsSchema.safeParse({ id })
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid listing ID format',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const supabase = await createAuthClient()

    // Get listing with realtor profile
    const { data: listing, error } = await supabase
      .from("Listing")
      .select(`
        *,
        realtor:User!userUlid (
          ulid,
          firstName,
          lastName,
          email,
          RealtorProfile!userUlid (
            bio,
            yearsExperience,
            specialties,
            certifications
          )
        )
      `)
      .eq("ulid", id)
      .single()

    if (error) {
      console.error("[LISTING_ERROR] Failed to fetch listing:", error)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch listing'
        }
      }, { status: 500 })
    }

    if (!listing) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Listing not found'
        }
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse<typeof listing>>({
      data: listing,
      error: null
    })
  } catch (error) {
    console.error("[LISTING_ERROR]", error)
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

// PUT /api/listings/[id] - Update a specific listing
export const PUT = withApiAuth(async (request: Request, ctx) => {
  const { userUlid } = ctx
  const id = request.url.split('/').slice(-1)[0]

  try {
    // Validate listing ID
    const validationResult = ListingParamsSchema.safeParse({ id })
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid listing ID format',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    // Validate request body
    const body = await request.json()
    const bodyValidation = listingBaseSchema.partial().safeParse(body)

    if (!bodyValidation.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid listing data',
          details: bodyValidation.error.flatten()
        }
      }, { status: 400 })
    }

    const supabase = await createAuthClient()

    // Verify ownership
    const { data: existingListing, error: fetchError } = await supabase
      .from("Listing")
      .select("userUlid")
      .eq("ulid", id)
      .single()

    if (fetchError || !existingListing) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Listing not found'
        }
      }, { status: 404 })
    }

    if (existingListing.userUlid !== userUlid) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this listing'
        }
      }, { status: 403 })
    }

    // Update the listing
    const { data: updatedListing, error: updateError } = await supabase
      .from("Listing")
      .update({
        ...bodyValidation.data,
        updatedAt: new Date().toISOString()
      })
      .eq("ulid", id)
      .select()
      .single()

    if (updateError) {
      console.error("[LISTING_ERROR] Failed to update listing:", updateError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update listing'
        }
      }, { status: 500 })
    }

    revalidatePath("/dashboard/listings")
    return NextResponse.json<ApiResponse<typeof updatedListing>>({
      data: updatedListing,
      error: null
    })
  } catch (error) {
    console.error("[LISTING_ERROR]", error)
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

// DELETE /api/listings/[id] - Delete a specific listing
export const DELETE = withApiAuth(async (request: Request, ctx) => {
  const { userUlid } = ctx
  const id = request.url.split('/').slice(-1)[0]

  try {
    // Validate listing ID
    const validationResult = ListingParamsSchema.safeParse({ id })
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid listing ID format',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const supabase = await createAuthClient()

    // Verify ownership
    const { data: existingListing, error: fetchError } = await supabase
      .from("Listing")
      .select("userUlid")
      .eq("ulid", id)
      .single()

    if (fetchError || !existingListing) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Listing not found'
        }
      }, { status: 404 })
    }

    if (existingListing.userUlid !== userUlid) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this listing'
        }
      }, { status: 403 })
    }

    // Delete the listing
    const { error: deleteError } = await supabase
      .from("Listing")
      .delete()
      .eq("ulid", id)

    if (deleteError) {
      console.error("[LISTING_ERROR] Failed to delete listing:", deleteError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete listing'
        }
      }, { status: 500 })
    }

    revalidatePath("/dashboard/listings")
    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error("[LISTING_ERROR]", error)
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