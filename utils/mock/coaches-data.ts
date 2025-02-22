import type { PublicCoach } from "@/utils/types/coach"

export const mockCoaches: PublicCoach[] = [
  {
    ulid: "01FGXYZ123ABC",
    firstName: "John",
    lastName: "Doe",
    displayName: "John Doe",
    bio: "Specializing in luxury residential properties with over 15 years of experience.",
    profileImageUrl: "https://example.com/john-doe.jpg",
    coachingSpecialties: ["Luxury Real Estate", "Residential Properties", "Investment Properties"],
    hourlyRate: 150,
    averageRating: 4.8,
    totalSessions: 42
  },
  {
    ulid: "01FGXYZ456DEF",
    firstName: "Jane",
    lastName: "Smith",
    displayName: "Jane Smith",
    bio: "Helping businesses find the perfect commercial spaces for over a decade.",
    profileImageUrl: "https://example.com/jane-smith.jpg",
    coachingSpecialties: ["Commercial Real Estate", "Property Management", "Business Development"],
    hourlyRate: 200,
    averageRating: 4.9,
    totalSessions: 38
  },
  // Add more mock coaches as needed
]

export const mockFeaturedCoaches = mockCoaches.slice(0, 3)

