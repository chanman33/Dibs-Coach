import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ROLES } from '@/utils/roles/roles'
import { getUserDbIdAndRole } from '@/utils/auth'
import { createAuthClient } from '@/utils/auth'

interface RealtorProfile {
  id: number
  companyName: string | null
  licenseNumber: string | null
  phoneNumber: string | null
}

interface Mentee {
  id: number
  firstName: string | null
  lastName: string | null
  email: string
  profileImageUrl: string | null
  realtorProfile: RealtorProfile | null
}

interface Session {
  menteeDbId: number
  mentee: Mentee
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userDbId, role } = await getUserDbIdAndRole(userId);
    if (!userDbId || !role) {
      console.error("[MENTEES_ERROR] Failed to get user");
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    if (role !== ROLES.COACH) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createAuthClient();
    
    // First get all mentee IDs from sessions
    const { data: sessionMentees, error: sessionError } = await supabase
      .from("Session")
      .select("menteeDbId")
      .eq("coachDbId", userDbId)
      .order("createdAt", { ascending: false });

    if (sessionError) {
      console.error("[MENTEES_ERROR] Failed to fetch session mentees:", sessionError);
      return NextResponse.json({ error: "Failed to fetch mentees" }, { status: 500 });
    }

    // If no sessions found, return empty array
    if (!sessionMentees || sessionMentees.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get unique mentee IDs
    const uniqueMenteeIds = Array.from(new Set(sessionMentees.map(s => s.menteeDbId)));

    // Fetch mentee details
    const { data: mentees, error: menteesError } = await supabase
      .from("User")
      .select(`
        id,
        firstName,
        lastName,
        email,
        profileImageUrl,
        realtorProfile:RealtorProfile (
          id,
          companyName,
          licenseNumber,
          phoneNumber
        )
      `)
      .in("id", uniqueMenteeIds);

    if (menteesError) {
      console.error("[MENTEES_ERROR] Failed to fetch mentee details:", menteesError);
      return NextResponse.json({ error: "Failed to fetch mentee details" }, { status: 500 });
    }

    // Return empty array instead of error when no mentees found
    return NextResponse.json({ data: mentees || [] });
  } catch (error) {
    console.error("[MENTEES_ERROR] Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 