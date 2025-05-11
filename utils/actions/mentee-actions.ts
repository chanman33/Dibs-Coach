'use server'

import { createAuthClient } from '@/utils/auth'
import { Mentee, Note } from '@/utils/types/mentee'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { ApiResponse, ApiErrorCode } from '@/utils/types/api'
import { generateUlid } from '@/utils/ulid'

interface FetchMenteesParams {
  coachUlid?: string
}

interface SupabaseMentee {
  ulid: string
  firstName: string | null
  lastName: string | null
  email: string
  profileImageUrl: string | null
  status: 'ACTIVE' | 'INACTIVE'
  phoneNumber: string | null
  totalYearsRE: number | null
  languages: string[] | null
  primaryMarket: string | null
  primaryDomain: string | null
  MenteeProfile: {
    focusAreas: string[]
    experienceLevel: string | null
    learningStyle: string | null
    sessionsCompleted: number
    lastSessionDate: string | null
    isActive: boolean
  } | null
  sessions: any[]
  notes: any[]
}

interface AddNoteParams {
  menteeUlid: string
  content: string
}

export const fetchMentees = withServerAction(
  async (params: FetchMenteesParams = {}, { userUlid }): Promise<ApiResponse<Mentee[]>> => {
    try {
      console.log('[FETCH_MENTEES] Starting with params:', params, 'userUlid:', userUlid)
      const supabase = await createAuthClient()

      // First, get all sessions where the current user is the coach
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select('menteeUlid')
        .eq('coachUlid', params.coachUlid || userUlid || '')
        .order('createdAt', { ascending: false })

      if (sessionsError) {
        console.error('[FETCH_MENTEES_ERROR] Failed to fetch sessions:', sessionsError)
        return { 
          data: null, 
          error: { 
            code: 'DATABASE_ERROR' as ApiErrorCode,
            message: 'Failed to fetch sessions',
            details: sessionsError
          }
        }
      }

      console.log('[FETCH_MENTEES] Retrieved sessions:', sessions?.length || 0)

      // Get unique mentee ULIDs
      const uniqueMenteeUlids = Array.from(new Set(sessions.map(s => s.menteeUlid)))

      if (uniqueMenteeUlids.length === 0) {
        console.log('[FETCH_MENTEES] No mentees found for this coach')
        return { data: [], error: null }
      }

      console.log('[FETCH_MENTEES] Unique mentee ULIDs:', uniqueMenteeUlids)

      // Fetch mentee details with their profiles
      const { data: mentees, error: menteesError } = await supabase
        .from('User')
        .select(`
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl,
          status,
          phoneNumber,
          totalYearsRE,
          languages,
          primaryMarket,
          primaryDomain,
          MenteeProfile (
            focusAreas,
            experienceLevel,
            learningStyle,
            sessionsCompleted,
            lastSessionDate,
            isActive
          ),
          sessions:Session!Session_menteeUlid_fkey (
            ulid,
            startTime,
            endTime,
            status,
            createdAt,
            updatedAt
          ),
          notes:Note!Note_relatedUserUlid_fkey (
            ulid,
            content,
            createdAt,
            updatedAt,
            relatedUserUlid,
            authorUlid
          )
        `)
        .in('ulid', uniqueMenteeUlids)

      if (menteesError) {
        console.error('[FETCH_MENTEES_ERROR] Failed to fetch mentee details:', menteesError)
        return { 
          data: null, 
          error: { 
            code: 'DATABASE_ERROR' as ApiErrorCode,
            message: 'Failed to fetch mentee details',
            details: menteesError
          }
        }
      }

      console.log('[FETCH_MENTEES] Retrieved mentees data:', mentees?.length || 0)
      console.log('[FETCH_MENTEES] Mentees structure sample:', mentees?.[0] ? JSON.stringify({
        ulid: mentees[0].ulid,
        sessions: mentees[0].sessions?.length || 0,
        notes: mentees[0].notes?.length || 0
      }) : 'No mentees found')

      // Safety check if mentees is null or not an array
      if (!mentees || !Array.isArray(mentees)) {
        console.error('[FETCH_MENTEES_ERROR] Unexpected mentees response format:', mentees)
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR' as ApiErrorCode,
            message: 'Unexpected data format from database',
            details: { received: typeof mentees }
          }
        }
      }

      // Filter notes to only include those related to the current mentee
      const transformedMentees = (mentees as unknown as SupabaseMentee[]).map(mentee => {
        // Construct domainProfile from available User fields
        const domainType = mentee.primaryDomain || null;
        const domainProfile = {
          ulid: mentee.ulid,
          type: domainType,
          phoneNumber: mentee.phoneNumber || null,
          totalYearsRE: mentee.totalYearsRE ?? null,
          languages: mentee.languages || [],
          primaryMarket: mentee.primaryMarket || null,
          // Fields that are no longer directly available will be null or empty
          companyName: null,
          licenseNumber: null,
          specializations: [],
          certifications: [],
          propertyTypes: [],
          geographicFocus: null,
        };

        // Safely handle notes - ensure we have an array
        const notesArray = mentee.notes || []
        
        // Filter notes to only include those related to this mentee
        const filteredNotes = notesArray.filter(note => 
          note && note.relatedUserUlid !== null && note.relatedUserUlid === mentee.ulid
        ).map(note => ({
          ulid: note.ulid,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          menteeUlid: note.relatedUserUlid,
          coachUlid: note.authorUlid
        }))

        // Transform the MenteeProfile object to match our client-side type expectations
        const menteeProfile = mentee.MenteeProfile ? {
          ...mentee.MenteeProfile,
          // Add any missing fields required by the client-side type
          // For example, if 'activeDomains' is needed by the client but no longer exists in DB:
          activeDomains: [] // Add an empty array to satisfy the client-side type
        } : null;

        return {
          ulid: mentee.ulid,
          firstName: mentee.firstName,
          lastName: mentee.lastName,
          email: mentee.email,
          profileImageUrl: mentee.profileImageUrl,
          status: mentee.status,
          phoneNumber: mentee.phoneNumber,
          totalYearsRE: mentee.totalYearsRE,
          languages: mentee.languages,
          primaryMarket: mentee.primaryMarket,
          primaryDomain: mentee.primaryDomain,
          menteeProfile,
          domainProfile,
          sessions: mentee.sessions || [],
          notes: filteredNotes
        }
      })

      console.log('[FETCH_MENTEES] Returning transformed mentees:', transformedMentees.length)
      
      return { data: transformedMentees, error: null }
    } catch (error) {
      console.error('[FETCH_MENTEES_ERROR] Unexpected error:', error)
      return { 
        data: null, 
        error: { 
          code: 'INTERNAL_ERROR' as ApiErrorCode,
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : undefined
        }
      }
    }
  },
  {
    requiredCapabilities: [USER_CAPABILITIES.COACH]
  }
)

export const fetchMenteeDetails = withServerAction(
  async (menteeId: string, { userUlid }): Promise<ApiResponse<Mentee>> => {
    try {
      console.log('[FETCH_MENTEE_DETAILS] Starting with menteeId:', menteeId, 'userUlid:', userUlid)
      const supabase = await createAuthClient()

      const { data: mentee, error: menteeError } = await supabase
        .from('User')
        .select(`
          ulid,
          firstName,
          lastName,
          email,
          profileImageUrl,
          status,
          phoneNumber,
          totalYearsRE,
          languages,
          primaryMarket,
          primaryDomain,
          MenteeProfile (
            focusAreas,
            experienceLevel,
            learningStyle,
            sessionsCompleted,
            lastSessionDate,
            isActive
          ),
          sessions:Session!Session_menteeUlid_fkey (
            ulid,
            startTime,
            endTime,
            status,
            createdAt,
            updatedAt,
            notes:Note!Note_sessionUlid_fkey (
              ulid,
              content,
              createdAt,
              updatedAt,
              relatedUserUlid,
              authorUlid
            )
          ),
          notes:Note!Note_relatedUserUlid_fkey (
            ulid,
            content,
            createdAt,
            updatedAt,
            relatedUserUlid,
            authorUlid
          )
        `)
        .eq('ulid', menteeId)
        .single()

      if (menteeError) {
        console.error('[FETCH_MENTEE_DETAILS_ERROR] Failed to fetch mentee details:', menteeError)
        return { 
          data: null, 
          error: { 
            code: 'DATABASE_ERROR' as ApiErrorCode,
            message: 'Failed to fetch mentee details',
            details: menteeError
          }
        }
      }

      console.log('[FETCH_MENTEE_DETAILS] Successfully retrieved mentee details:', mentee ? mentee.ulid : 'No mentee found')
      console.log('[FETCH_MENTEE_DETAILS] Mentee data structure:', mentee ? JSON.stringify({
        sessions: mentee.sessions?.length || 0,
        notes: mentee.notes?.length || 0,
        hasMenteeProfile: !!mentee.MenteeProfile
      }) : 'No mentee data')

      if (!mentee) {
        console.error('[FETCH_MENTEE_DETAILS_ERROR] No mentee found with id:', menteeId)
        return {
          data: null,
          error: {
            code: 'NOT_FOUND' as ApiErrorCode,
            message: 'Mentee not found',
            details: { menteeId }
          }
        }
      }

      // Transform the data to match our types
      const typedMentee = mentee as unknown as SupabaseMentee
      
      const domainTypeFromUser = typedMentee.primaryDomain;
      const domainType = domainTypeFromUser || null;

      const domainProfileData = {
        ulid: typedMentee.ulid,
        type: domainType,
        phoneNumber: typedMentee.phoneNumber || null,
        totalYearsRE: typedMentee.totalYearsRE ?? null,
        languages: typedMentee.languages || [],
        primaryMarket: typedMentee.primaryMarket || null,
        // Fields that are no longer directly available will be null or empty
        companyName: null, 
        licenseNumber: null,
        specializations: [],
        certifications: [],
        propertyTypes: [],
        geographicFocus: null,
      };

      // Safely handle notes - ensure we have an array
      const notesArray = typedMentee.notes || []

      // Filter notes to only include those related to this mentee
      const filteredNotes = notesArray.filter(note => 
        note && note.relatedUserUlid !== null && note.relatedUserUlid === typedMentee.ulid
      ).map(note => ({
        ulid: note.ulid,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        menteeUlid: note.relatedUserUlid,
        coachUlid: note.authorUlid
      }));

      // Transform the MenteeProfile object to match our client-side type expectations
      const menteeProfile = typedMentee.MenteeProfile ? {
        ...typedMentee.MenteeProfile,
        // Add any missing fields required by the client-side type
        activeDomains: [] // Add an empty array to satisfy the client-side type
      } : null;

      const transformedMentee = {
        ulid: typedMentee.ulid,
        firstName: typedMentee.firstName,
        lastName: typedMentee.lastName,
        email: typedMentee.email,
        profileImageUrl: typedMentee.profileImageUrl,
        status: typedMentee.status,
        phoneNumber: typedMentee.phoneNumber,
        totalYearsRE: typedMentee.totalYearsRE,
        languages: typedMentee.languages,
        primaryMarket: typedMentee.primaryMarket,
        primaryDomain: typedMentee.primaryDomain,
        menteeProfile,
        domainProfile: domainProfileData,
        sessions: typedMentee.sessions || [],
        notes: filteredNotes
      }

      console.log('[FETCH_MENTEE_DETAILS] Returning transformed mentee data')
      
      return { data: transformedMentee, error: null }
    } catch (error) {
      console.error('[FETCH_MENTEE_DETAILS_ERROR] Unexpected error:', error)
      return { 
        data: null, 
        error: { 
          code: 'INTERNAL_ERROR' as ApiErrorCode,
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : undefined
        }
      }
    }
  },
  {
    requiredCapabilities: [USER_CAPABILITIES.COACH]
  }
)

export const addNote = withServerAction(
  async (params: AddNoteParams, { userUlid }): Promise<ApiResponse<Note>> => {
    try {
      if (!userUlid) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED' as ApiErrorCode,
            message: 'User not authenticated',
            details: null
          }
        }
      }

      const supabase = await createAuthClient()

      // First, check if the user has access to this mentee
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select('ulid')
        .eq('coachUlid', userUlid)
        .eq('menteeUlid', params.menteeUlid)
        .limit(1)

      if (sessionsError) {
        console.error('[ADD_NOTE_ERROR] Failed to check access:', sessionsError)
        return { 
          data: null, 
          error: { 
            code: 'DATABASE_ERROR' as ApiErrorCode,
            message: 'Failed to check access',
            details: sessionsError
          }
        }
      }

      if (!sessions.length) {
        return { 
          data: null, 
          error: { 
            code: 'FORBIDDEN' as ApiErrorCode,
            message: 'You do not have access to this mentee',
            details: null
          }
        }
      }

      // Generate a new ULID for the note
      const noteUlid = generateUlid()

      // Add the note using the correct schema
      const { data: note, error: noteError } = await supabase
        .from('Note')
        .insert({
          ulid: noteUlid,
          content: params.content,
          authorUlid: userUlid,
          relatedUserUlid: params.menteeUlid,
          visibility: 'private',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (noteError) {
        console.error('[ADD_NOTE_ERROR] Failed to add note:', noteError)
        return { 
          data: null, 
          error: { 
            code: 'DATABASE_ERROR' as ApiErrorCode,
            message: 'Failed to add note',
            details: noteError
          }
        }
      }

      // Transform the note to match our expected format
      const transformedNote: Note = {
        ulid: note.ulid,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        menteeUlid: note.relatedUserUlid,
        coachUlid: note.authorUlid
      }

      return { data: transformedNote, error: null }
    } catch (error) {
      console.error('[ADD_NOTE_ERROR] Unexpected error:', error)
      return { 
        data: null, 
        error: { 
          code: 'INTERNAL_ERROR' as ApiErrorCode,
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : undefined
        }
      }
    }
  },
  {
    requiredCapabilities: [USER_CAPABILITIES.COACH]
  }
) 