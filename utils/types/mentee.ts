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
  licensedStates: string[]
}

// Interface for top mentees in coach dashboard
export interface TopMentee {
  ulid: string
  firstName: string | null
  lastName: string | null
  profileImageUrl: string | null
  sessionsCompleted: number
  revenue: number
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
}

export interface InsuranceProfile extends BaseProfile {
  type: 'INSURANCE'
  insuranceTypes: string[]
}

// New interface for the restructured domain profile data
export interface DomainProfileData {
  ulid: string; // User ULID
  type: string | null; // e.g., 'REALTOR', 'LOAN_OFFICER', or from User.primaryDomain

  // Fields from User model
  phoneNumber: string | null;
  totalYearsRE: number | null; // Corresponds to what was 'yearsExperience' in some old profiles
  languages: string[];
  primaryMarket: string | null;

  // Fields that were part of BaseProfile or specific profiles, now potentially absent
  // UI must handle their absence by showing "Not specified" or similar.
  companyName?: string | null;
  licenseNumber?: string | null;
  specializations?: string[];
  certifications?: string[];
  geographicFocus?: any | null; 

  // Domain-specific fields that might be absent or set to default values
  propertyTypes?: string[]; // e.g., for Realtor
  nmls?: string | null; // e.g., for LoanOfficer
  investmentStrategies?: string[]; // e.g., for Investor
  managerTypes?: string[]; // e.g., for PropertyManager
  titleEscrowTypes?: string[]; // e.g., for TitleEscrow
  insuranceTypes?: string[]; // e.g., for Insurance
  // Add other common fields as optional if they were used across multiple old profiles
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
  menteeUlid: string | null
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
  domainProfile: DomainProfileData | null
  notes: Note[]
  sessions: Session[]
} 