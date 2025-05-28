// Interface for top mentees in coach dashboard
export interface TopMentee {
  ulid: string
  firstName: string | null
  lastName: string | null
  profileImageUrl: string | null
  sessionsCompleted: number
  revenue: number
}

export interface MenteeProfile {
  focusAreas: string[]
  experienceLevel: string | null
  learningStyle: string | null
  sessionsCompleted: number
  lastSessionDate: string | null
  isActive: boolean
}

export interface Note {
  ulid: string
  content: string
  createdAt: string
  updatedAt: string
  relatedUserUlid: string | null
  authorUlid: string
  sessionUlid: string | null
  visibility: string
}

export interface Session {
  ulid: string
  startTime: string
  endTime: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'ABSENT' | 'COACH_PROPOSED_RESCHEDULE'
  sessionType: 'MANAGED' | 'GROUP_SESSION' | 'OFFICE_HOURS'
  notes: Note[]
  createdAt: string
  updatedAt: string
  menteeUlid: string
  coachUlid: string
}

export interface Mentee {
  ulid: string
  firstName: string | null
  lastName: string | null
  email: string
  profileImageUrl: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  phoneNumber: string | null
  totalYearsRE: number
  realEstateDomains: string[]
  languages: string[]
  primaryMarket: string | null
  menteeProfile: MenteeProfile | null
  notes: Note[]
  sessions: Session[]
  domainProfile?: {
    type?: string | null
    companyName?: string | null
    phoneNumber?: string | null
    licenseNumber?: string | null
    totalYearsRE?: number | null
    propertyTypes?: string[] | null
    nmls?: string | null
    specializations?: string[] | null
    certifications?: string[] | null
    languages?: string[] | null
    primaryMarket?: string | null
    // Add other domain-specific profile fields here as needed
  } | null
} 