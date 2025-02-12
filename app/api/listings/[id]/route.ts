import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "@/utils/auth"
import { updateListingSchema } from "@/utils/types/listing"
import { revalidatePath } from "next/cache"
import { UserWithProfile, ListingWithRealtor } from "@/utils/supabase/database"

// GET /api/listings/[id] - Get a specific listing
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const supabase = await createAuthClient()

    const { data: listing, error } = await supabase
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
      .eq("id", params.id)
      .single() as { data: ListingWithRealtor | null, error: any }

    if (error) {
      console.error("[LISTING_GET_ERROR]", error)
      return new NextResponse("Failed to fetch listing", { status: 500 })
    }

    if (!listing) {
      return new NextResponse("Listing not found", { status: 404 })
    }

    return NextResponse.json(listing)
  } catch (error) {
    console.error("[LISTING_GET_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// PUT /api/listings/[id] - Update a specific listing
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateListingSchema.parse(body)

    const supabase = await createAuthClient()

    // Verify ownership
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
      console.error("[LISTING_PUT_USER_ERROR]", userError)
      return new NextResponse("Failed to fetch user data", { status: 500 })
    }

    if (!userData?.realtorProfile?.id) {
      return new NextResponse("User not found or no realtor profile", { status: 404 })
    }

    // Update the listing
    const { data: listing, error } = await supabase
      .from("Listing")
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("realtorProfileId", userData.realtorProfile.id)
      .single() as { data: ListingWithRealtor | null, error: any }

    if (error) {
      console.error("[LISTING_PUT_ERROR]", error)
      return new NextResponse("Failed to update listing", { status: 500 })
    }

    if (!listing) {
      return new NextResponse("Listing not found or unauthorized", { status: 404 })
    }

    revalidatePath("/dashboard/listings")
    return NextResponse.json(listing)
  } catch (error) {
    console.error("[LISTING_PUT_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// DELETE /api/listings/[id] - Delete a specific listing
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const supabase = await createAuthClient()

    // Verify ownership
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select(`
        id,
        realtorProfile:RealtorProfile (
          id
        )
      `)
      .eq("userId", userId)
      .single()

    if (userError) {
      console.error("[LISTING_DELETE_USER_ERROR]", userError)
      return new NextResponse("Failed to fetch user data", { status: 500 })
    }

    if (!userData?.realtorProfile?.id) {
      return new NextResponse("User not found or no realtor profile", { status: 404 })
    }

    // First verify the listing exists and belongs to the user
    const { data: listing, error: listingError } = await supabase
      .from("Listing")
      .select("id")
      .eq("id", params.id)
      .eq("realtorProfileId", userData.realtorProfile.id)
      .single() as { data: ListingWithRealtor | null, error: any }

    if (listingError) {
      console.error("[LISTING_DELETE_CHECK_ERROR]", listingError)
      return new NextResponse("Failed to verify listing ownership", { status: 500 })
    }

    if (!listing) {
      return new NextResponse("Listing not found or unauthorized", { status: 404 })
    }

    // Delete the listing
    const { error } = await supabase
      .from("Listing")
      .delete()
      .eq("id", params.id)
      .eq("realtorProfileId", userData.realtorProfile.id)

    if (error) {
      console.error("[LISTING_DELETE_ERROR]", error)
      return new NextResponse("Failed to delete listing", { status: 500 })
    }

    revalidatePath("/dashboard/listings")
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[LISTING_DELETE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 