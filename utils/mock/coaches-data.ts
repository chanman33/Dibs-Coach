import type { PublicCoach, RealEstateDomain } from "@/utils/types/coach"
import { REAL_ESTATE_DOMAINS } from "@/utils/types/coach"

export const mockCoaches: PublicCoach[] = [
  {
    ulid: "01FGXYZ123ABC",
    userUlid: "01FGXYZ123DEF",
    firstName: "John",
    lastName: "Doe",
    displayName: "John Doe",
    bio: "Specializing in luxury residential properties with over 15 years of experience.",
    profileImageUrl: "https://example.com/john-doe.jpg",
    slogan: "Elevating your real estate career to new heights",
    profileSlug: "john-doe",
    coachSkills: ["Luxury Real Estate", "Residential Properties", "Investment Properties"],
    coachRealEstateDomains: [REAL_ESTATE_DOMAINS.REALTOR, REAL_ESTATE_DOMAINS.INVESTOR],
    coachPrimaryDomain: REAL_ESTATE_DOMAINS.REALTOR,
    hourlyRate: 150,
    averageRating: 4.8,
    totalSessions: 42,
    sessionConfig: {
      defaultDuration: 60,
      minimumDuration: 30,
      maximumDuration: 120,
      allowCustomDuration: true
    }
  },
  {
    ulid: "01FGXYZ456DEF",
    userUlid: "01FGXYZ456GHI",
    firstName: "Jane",
    lastName: "Smith",
    displayName: "Jane Smith",
    bio: "Helping businesses find the perfect commercial spaces for over a decade.",
    profileImageUrl: "https://example.com/jane-smith.jpg",
    slogan: "Building commercial success through strategic real estate",
    profileSlug: "jane-smith",
    coachSkills: ["Commercial Real Estate", "Property Management", "Business Development"],
    coachRealEstateDomains: [REAL_ESTATE_DOMAINS.COMMERCIAL, REAL_ESTATE_DOMAINS.PROPERTY_MANAGER],
    coachPrimaryDomain: REAL_ESTATE_DOMAINS.COMMERCIAL,
    hourlyRate: 200,
    averageRating: 4.9,
    totalSessions: 38,
    sessionConfig: {
      defaultDuration: 45,
      minimumDuration: 30,
      maximumDuration: 90,
      allowCustomDuration: false
    }
  },
  // Add more mock coaches as needed
]

export const mockFeaturedCoaches = mockCoaches.slice(0, 3)

