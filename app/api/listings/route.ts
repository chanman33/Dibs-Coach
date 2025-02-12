import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "@/utils/auth"
import { createListingSchema } from "@/utils/types/listing"
import { revalidatePath } from "next/cache"
import { UserWithProfile, ListingWithRealtor } from "@/utils/types/database"

// GET /api/listings - Get all listings (with optional filters)
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const propertyType = searchParams.get("propertyType")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")

    const supabase = await createAuthClient()

    let query = supabase
      .from("Listing")
      .select(`
        *,
        realtorProfile:RealtorProfile (
          id,
          userDbId,
          bio,
          yearsExperience
        )
      `)

    // Apply filters if provided
    if (status) {
      query = query.eq("status", status)
    }
    if (propertyType) {
      query = query.eq("propertyType", propertyType)
    }
    if (minPrice) {
      query = query.gte("listPrice", parseFloat(minPrice))
    }
    if (maxPrice) {
      query = query.lte("listPrice", parseFloat(maxPrice))
    }

    const { data: listings, error } = await query

    if (error) {
      console.error("[LISTINGS_GET_ERROR]", error)
      return new NextResponse("Internal error", { status: 500 })
    }

    return NextResponse.json(listings)
  } catch (error) {
    console.error("[LISTINGS_GET_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// POST /api/listings - Create a new listing
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const validatedData = createListingSchema.parse(body)

    const supabase = await createAuthClient()

    // Get the user's database ID and realtorProfile ID
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select(`
        id,
        realtorProfile:RealtorProfile (
          id
        )
      `)
      .eq("userId", userId)
      .single() as { data: UserWithProfile | null, error: any }

    if (userError) {
      console.error("[LISTINGS_POST_USER_ERROR]", userError)
      return new NextResponse("Failed to fetch user data", { status: 500 })
    }

    if (!userData?.realtorProfile?.id) {
      return new NextResponse("User not found or no realtor profile", { status: 404 })
    }

    // Create the listing
    const { data: listing, error } = await supabase
      .from("Listing")
      .insert({
        ...validatedData,
        realtorProfileId: userData.realtorProfile.id,
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        realtorProfile:RealtorProfile (
          id,
          userDbId,
          bio,
          yearsExperience
        )
      `)
      .single()

    if (error) {
      console.error("[LISTINGS_POST_ERROR]", error)
      return new NextResponse("Failed to create listing", { status: 500 })
    }

    revalidatePath("/dashboard/listings")
    return NextResponse.json(listing)
  } catch (error) {
    console.error("[LISTINGS_POST_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 