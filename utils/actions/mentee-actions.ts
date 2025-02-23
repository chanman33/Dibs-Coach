'use server'

import { createAuthClient } from '@/utils/auth'
import { Mentee, Note } from '@/utils/types/mentee'
import { withServerAction } from '@/utils/middleware/withServerAction'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { ApiResponse } from '@/utils/types'

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
  MenteeProfile: {
    focusAreas: string[]
    experienceLevel: string | null
    learningStyle: string | null
    sessionsCompleted: number
    lastSessionDate: string | null
    activeDomains: string[]
  } | null
  RealtorProfile: any | null
  LoanOfficerProfile: any | null
  InvestorProfile: any | null
  PropertyManagerProfile: any | null
  TitleEscrowProfile: any | null
  InsuranceProfile: any | null
  Session: any[]
  Note: any[]
}

interface AddNoteParams {
  menteeUlid: string
  content: string
}

export const fetchMentees = withServerAction(
  async (params: FetchMenteesParams = {}, { userUlid }): Promise<ApiResponse<Mentee[]>> => {
    try {
      const supabase = await createAuthClient()

      // First, get all sessions where the current user is the coach
      const { data: sessions, error: sessionsError } = await supabase
        .from('Session')
        .select('menteeUlid')
        .eq('coachUlid', params.coachUlid || userUlid)
        .order('createdAt', { ascending: false })

      if (sessionsError) {
        console.error('[FETCH_MENTEES_ERROR] Failed to fetch sessions:', sessionsError)
        return { 
          data: null, 
          error: { 
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch sessions',
            details: sessionsError
          }
        }
      }

      // Get unique mentee ULIDs
      const uniqueMenteeUlids = Array.from(new Set(sessions.map(s => s.menteeUlid)))

      if (uniqueMenteeUlids.length === 0) {
        return { data: [], error: null }
      }

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
          MenteeProfile (
            focusAreas,
            experienceLevel,
            learningStyle,
            sessionsCompleted,
            lastSessionDate,
            activeDomains
          ),
          RealtorProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            phoneNumber,
            yearsExperience,
            propertyTypes
          ),
          LoanOfficerProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            nmls,
            lenderName,
            branchLocation,
            loanTypes,
            licensedStates
          ),
          InvestorProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            investmentStrategies,
            targetMarkets
          ),
          PropertyManagerProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            managerTypes,
            serviceZips
          ),
          TitleEscrowProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            titleEscrowTypes,
            licensedStates
          ),
          InsuranceProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            insuranceTypes,
            licensedStates
          ),
          Session!menteeUlid (
            id,
            startTime,
            endTime,
            status,
            createdAt,
            updatedAt,
            notes:SessionNote (
              id,
              content,
              createdAt,
              updatedAt
            )
          ),
          Note (
            id,
            content,
            createdAt,
            updatedAt
          )
        `)
        .in('ulid', uniqueMenteeUlids)

      if (menteesError) {
        console.error('[FETCH_MENTEES_ERROR] Failed to fetch mentee details:', menteesError)
        return { 
          data: null, 
          error: { 
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch mentee details',
            details: menteesError
          }
        }
      }

      // Transform the data to match our types
      const transformedMentees = (mentees as unknown as SupabaseMentee[]).map(mentee => {
        // Find the active domain profile
        const activeDomain = mentee.MenteeProfile?.activeDomains?.[0]
        let domainProfile = null

        if (activeDomain) {
          switch (activeDomain) {
            case 'REALTOR':
              domainProfile = mentee.RealtorProfile
              break
            case 'LOAN_OFFICER':
              domainProfile = mentee.LoanOfficerProfile
              break
            case 'INVESTOR':
              domainProfile = mentee.InvestorProfile
              break
            case 'PROPERTY_MANAGER':
              domainProfile = mentee.PropertyManagerProfile
              break
            case 'TITLE_OFFICER':
              domainProfile = mentee.TitleEscrowProfile
              break
            case 'INSURANCE':
              domainProfile = mentee.InsuranceProfile
              break
          }
        }

        return {
          ulid: mentee.ulid,
          firstName: mentee.firstName,
          lastName: mentee.lastName,
          email: mentee.email,
          profileImageUrl: mentee.profileImageUrl,
          status: mentee.status,
          menteeProfile: mentee.MenteeProfile,
          domainProfile,
          sessions: mentee.Session || [],
          notes: mentee.Note || []
        }
      })

      return { data: transformedMentees, error: null }
    } catch (error) {
      console.error('[FETCH_MENTEES_ERROR] Unexpected error:', error)
      return { 
        data: null, 
        error: { 
          code: 'INTERNAL_ERROR',
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
          MenteeProfile (
            focusAreas,
            experienceLevel,
            learningStyle,
            sessionsCompleted,
            lastSessionDate,
            activeDomains
          ),
          RealtorProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            phoneNumber,
            yearsExperience,
            propertyTypes
          ),
          LoanOfficerProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            nmls,
            lenderName,
            branchLocation,
            loanTypes,
            licensedStates
          ),
          InvestorProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            investmentStrategies,
            targetMarkets
          ),
          PropertyManagerProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            managerTypes,
            serviceZips
          ),
          TitleEscrowProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            titleEscrowTypes,
            licensedStates
          ),
          InsuranceProfile (
            ulid,
            companyName,
            licenseNumber,
            specializations,
            certifications,
            languages,
            geographicFocus,
            primaryMarket,
            type:profileType,
            insuranceTypes,
            licensedStates
          ),
          Session!menteeUlid (
            id,
            startTime,
            endTime,
            status,
            createdAt,
            updatedAt,
            notes:SessionNote (
              id,
              content,
              createdAt,
              updatedAt
            )
          ),
          Note (
            id,
            content,
            createdAt,
            updatedAt
          )
        `)
        .eq('ulid', menteeId)
        .single()

      if (menteeError) {
        console.error('[FETCH_MENTEE_DETAILS_ERROR] Failed to fetch mentee details:', menteeError)
        return { 
          data: null, 
          error: { 
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch mentee details',
            details: menteeError
          }
        }
      }

      // Transform the data to match our types
      const typedMentee = mentee as unknown as SupabaseMentee
      const activeDomain = typedMentee.MenteeProfile?.activeDomains?.[0]
      let domainProfile = null

      if (activeDomain) {
        switch (activeDomain) {
          case 'REALTOR':
            domainProfile = typedMentee.RealtorProfile
            break
          case 'LOAN_OFFICER':
            domainProfile = typedMentee.LoanOfficerProfile
            break
          case 'INVESTOR':
            domainProfile = typedMentee.InvestorProfile
            break
          case 'PROPERTY_MANAGER':
            domainProfile = typedMentee.PropertyManagerProfile
            break
          case 'TITLE_OFFICER':
            domainProfile = typedMentee.TitleEscrowProfile
            break
          case 'INSURANCE':
            domainProfile = typedMentee.InsuranceProfile
            break
        }
      }

      const transformedMentee = {
        ulid: typedMentee.ulid,
        firstName: typedMentee.firstName,
        lastName: typedMentee.lastName,
        email: typedMentee.email,
        profileImageUrl: typedMentee.profileImageUrl,
        status: typedMentee.status,
        menteeProfile: typedMentee.MenteeProfile,
        domainProfile,
        sessions: typedMentee.Session || [],
        notes: typedMentee.Note || []
      }

      return { data: transformedMentee, error: null }
    } catch (error) {
      console.error('[FETCH_MENTEE_DETAILS_ERROR] Unexpected error:', error)
      return { 
        data: null, 
        error: { 
          code: 'INTERNAL_ERROR',
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
            code: 'DATABASE_ERROR',
            message: 'Failed to check access',
            details: sessionsError
          }
        }
      }

      if (!sessions.length) {
        return { 
          data: null, 
          error: { 
            code: 'FORBIDDEN',
            message: 'You do not have access to this mentee',
            details: null
          }
        }
      }

      // Add the note
      const { data: note, error: noteError } = await supabase
        .from('Note')
        .insert({
          content: params.content,
          menteeUlid: params.menteeUlid,
          coachUlid: userUlid,
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
            code: 'DATABASE_ERROR',
            message: 'Failed to add note',
            details: noteError
          }
        }
      }

      return { data: note as Note, error: null }
    } catch (error) {
      console.error('[ADD_NOTE_ERROR] Unexpected error:', error)
      return { 
        data: null, 
        error: { 
          code: 'INTERNAL_ERROR',
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