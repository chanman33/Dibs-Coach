// Base profile interface with common fields
export interface BaseProfile {
  ulid: string
  companyName: string | null
  licenseNumber: string | null
  specializations: string[]
  certifications: string[]
  languages: string[]
  geographicFocus: any
  primaryMarket: string | null
}

// Domain-specific profile interfaces
export interface RealtorProfile extends BaseProfile {
  type: 'REALTOR'
  phoneNumber: string | null
  yearsExperience: number | null
  propertyTypes: string[]
}

export interface LoanOfficerProfile extends BaseProfile {
  type: 'LOAN_OFFICER'
  nmls: string | null
  lenderName: string | null
  branchLocation: string | null
  loanTypes: string[]
  licensedStates: string[]
}

export interface InvestorProfile extends BaseProfile {
  type: 'INVESTOR'
  investmentStrategies: string[]
  targetMarkets: string[]
}

export interface PropertyManagerProfile extends BaseProfile {
  type: 'PROPERTY_MANAGER'
  managerTypes: string[]
  serviceZips: string[]
}

export interface TitleEscrowProfile extends BaseProfile {
  type: 'TITLE_OFFICER'
  titleEscrowTypes: string[]
  licensedStates: string[]
}

export interface InsuranceProfile extends BaseProfile {
  type: 'INSURANCE'
  insuranceTypes: string[]
  licensedStates: string[]
}

export interface MenteeProfile {
  focusAreas: string[]
  experienceLevel: string | null
  learningStyle: string | null
  sessionsCompleted: number
  lastSessionDate: string | null
  activeDomains: string[]
}

export interface Note {
  ulid: string
  content: string
  createdAt: string
  updatedAt: string
  menteeUlid: string
  coachUlid: string
}

export interface Session {
  ulid: string
  startTime: string
  endTime: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
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
  status: 'ACTIVE' | 'INACTIVE'
  menteeProfile: MenteeProfile | null
  domainProfile: (
    | RealtorProfile 
    | LoanOfficerProfile 
    | InvestorProfile 
    | PropertyManagerProfile 
    | TitleEscrowProfile 
    | InsuranceProfile
  ) | null
  notes: Note[]
  sessions: Session[]
} 