import { createAuthClient } from "@/utils/auth"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Validate auth
    const session = await auth()
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get supabase client
    const supabase = await createAuthClient()

    // Get user's ULID
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("ulid")
      .eq("userId", session.userId)
      .single()

    if (userError || !userData) {
      return new NextResponse("User not found", { status: 404 })
    }

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
      .eq("userUlid", userData.ulid)
      .single()

    if (marketingError) {
      console.error("[DB_ERROR]", marketingError)
      return new NextResponse("Failed to fetch marketing information", { status: 500 })
    }

    return NextResponse.json({ data: marketingData })
  } catch (error) {
    console.error("[API_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// PUT endpoint for updating marketing information
export async function PUT(request: Request) {
  try {
    // Validate auth
    const session = await auth()
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get request body
    const body = await request.json()

    // Get supabase client
    const supabase = await createAuthClient()

    // Get user's ULID
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("ulid")
      .eq("userId", session.userId)
      .single()

    if (userError || !userData) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Update marketing information
    const { error: updateError } = await supabase
      .from("RealtorProfile")
      .update({
        slogan: body.slogan,
        websiteUrl: body.websiteUrl,
        facebookUrl: body.facebookUrl,
        instagramUrl: body.instagramUrl,
        linkedinUrl: body.linkedinUrl,
        youtubeUrl: body.youtubeUrl,
        marketingAreas: body.marketingAreas ? body.marketingAreas.split(",").map((area: string) => area.trim()) : [],
        testimonials: body.testimonials,
        updatedAt: new Date().toISOString(),
      })
      .eq("userUlid", userData.ulid)

    if (updateError) {
      console.error("[DB_ERROR]", updateError)
      return new NextResponse("Failed to update marketing information", { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 