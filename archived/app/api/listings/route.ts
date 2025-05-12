import { NextResponse } from "next/server"
import { ApiResponse } from "@/utils/types/api"
import { withApiAuth } from "@/utils/middleware/withApiAuth"
import { createAuthClient } from "@/utils/auth"
import { z } from "zod"
import { listingBaseSchema, type ListingBase } from "@/utils/types/listing"
import { ulidSchema } from "@/utils/types/auth"

// Query parameters validation schema
const ListingFiltersSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING', 'SOLD', 'ARCHIVED']).optional(),
  propertyType: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
})

// GET /api/listings - Get all listings (with optional filters)
export const GET = withApiAuth<ListingBase[]>(async (request: Request, { userUlid }) => {
  try {
    const { searchParams } = new URL(request.url)
    const filters = ListingFiltersSchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      propertyType: searchParams.get("propertyType") ?? undefined,
      minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice") ?? "") : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice") ?? "") : undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page") ?? "") : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit") ?? "") : undefined
    })

    if (!filters.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_FILTERS',
          message: 'Invalid filter parameters',
          details: filters.error.flatten()
        }
      }, { status: 400 })
    }

    const supabase = await createAuthClient()
    let query = supabase.from('Listing').select('*')

    // Apply filters
    if (filters.data.status) {
      query = query.eq('status', filters.data.status)
    }
    if (filters.data.propertyType) {
      query = query.eq('propertyType', filters.data.propertyType)
    }
    if (filters.data.minPrice) {
      query = query.gte('price', filters.data.minPrice)
    }
    if (filters.data.maxPrice) {
      query = query.lte('price', filters.data.maxPrice)
    }

    // Add pagination
    const page = filters.data.page || 1
    const limit = filters.data.limit || 20
    const start = (page - 1) * limit
    query = query.range(start, start + limit - 1)

    // Execute query
    const { data: listings, error } = await query.order('createdAt', { ascending: false })

    if (error) {
      console.error('[LISTINGS_ERROR] Failed to fetch listings:', error)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch listings'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<ListingBase[]>>({
      data: listings,
      error: null
    })
  } catch (error) {
    console.error("[LISTINGS_ERROR]", error)
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

// POST /api/listings - Create a new listing
export const POST = withApiAuth<ListingBase>(async (request: Request, { userUlid }) => {
  try {
    const body = await request.json()
    const validationResult = listingBaseSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid listing data',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const supabase = await createAuthClient()
    const { data: listing, error } = await supabase
      .from('Listing')
      .insert({
        ...validationResult.data,
        userUlid,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[LISTINGS_ERROR] Failed to create listing:', error)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create listing'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<ListingBase>>({
      data: listing,
      error: null
    })
  } catch (error) {
    console.error("[LISTINGS_ERROR]", error)
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

// PUT /api/listings/:id - Update a listing
export const PUT = withApiAuth<ListingBase>(async (request: Request, { userUlid }) => {
  try {
    const listingUlid = request.url.split('/').pop()
    if (!listingUlid || !ulidSchema.safeParse(listingUlid).success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid listing ID format'
        }
      }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = listingBaseSchema.partial().safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid listing data',
          details: validationResult.error.flatten()
        }
      }, { status: 400 })
    }

    const supabase = await createAuthClient()

    // Verify ownership
    const { data: existingListing, error: fetchError } = await supabase
      .from('Listing')
      .select('userUlid')
      .eq('ulid', listingUlid)
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
      .from('Listing')
      .update({
        ...validationResult.data,
        updatedAt: new Date().toISOString()
      })
      .eq('ulid', listingUlid)
      .select()
      .single()

    if (updateError) {
      console.error('[LISTINGS_ERROR] Failed to update listing:', updateError)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update listing'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<ListingBase>>({
      data: updatedListing,
      error: null
    })
  } catch (error) {
    console.error("[LISTINGS_ERROR]", error)
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