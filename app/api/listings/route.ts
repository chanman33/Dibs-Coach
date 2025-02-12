import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createListing, fetchListings, updateListing, deleteListing } from "@/utils/actions/listings"
import { createListingSchema } from "@/utils/types/listing"

// GET /api/listings - Get all listings (with optional filters)
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get("status") || undefined,
      propertyType: searchParams.get("propertyType") || undefined,
      minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined
    }

    // Use the server action
    const { data, error } = await fetchListings(filters)

    if (error) {
      return new NextResponse(error, { status: 500 })
    }

    return NextResponse.json(data)
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

    // Use the server action
    const { data, error } = await createListing(validatedData)

    if (error) {
      return new NextResponse(error, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[LISTINGS_POST_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 