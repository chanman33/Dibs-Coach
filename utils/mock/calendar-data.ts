import { addDays, addHours, addMinutes, addWeeks, setHours, setMinutes, startOfDay } from 'date-fns'
import config from '@/config'

interface ExtendedSession {
  ulid: string
  startTime: string
  endTime: string
  durationMinutes: number
  status: string
  userRole: string
  otherParty: {
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string | null
    imageUrl: string | null
  }
}

// Helper to generate a random time between 9 AM and 5 PM
const getRandomTime = (date: Date) => {
  const start = setHours(setMinutes(startOfDay(date), 0), 9) // 9 AM
  const randomMinutes = Math.floor(Math.random() * 16) * 30 // Random 30-min slot between 9 AM and 5 PM
  return addMinutes(start, randomMinutes)
}

// Mock coach data
const mockCoaches = [
  {
    ulid: 'coach-1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@example.com',
    imageUrl: null
  },
  {
    ulid: 'coach-2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael@example.com',
    imageUrl: null
  },
  {
    ulid: 'coach-3',
    firstName: 'Jessica',
    lastName: 'Williams',
    email: 'jessica@example.com',
    imageUrl: null
  }
]

// Generate past sessions
const generatePastSessions = (count: number): ExtendedSession[] => {
  const now = new Date()
  const sessions: ExtendedSession[] = []

  for (let i = 0; i < count; i++) {
    const daysAgo = i + 1
    const startTime = getRandomTime(addDays(now, -daysAgo))
    const coach = mockCoaches[i % mockCoaches.length]
    
    sessions.push({
      ulid: `past-session-${i}`,
      startTime: startTime.toISOString(),
      endTime: addHours(startTime, 1).toISOString(),
      durationMinutes: 60,
      status: i === 0 ? 'completed' : i === 1 ? 'no_show' : 'cancelled',
      userRole: 'mentee',
      otherParty: coach
    })
  }

  return sessions
}

// Generate future sessions
const generateFutureSessions = (count: number): ExtendedSession[] => {
  const now = new Date()
  const sessions: ExtendedSession[] = []

  for (let i = 0; i < count; i++) {
    const daysAhead = i + 1
    const startTime = getRandomTime(addDays(now, daysAhead))
    const coach = mockCoaches[i % mockCoaches.length]
    
    sessions.push({
      ulid: `future-session-${i}`,
      startTime: startTime.toISOString(),
      endTime: addHours(startTime, 1).toISOString(),
      durationMinutes: 60,
      status: 'scheduled',
      userRole: 'mentee',
      otherParty: coach
    })
  }

  return sessions
}

export enum MockDataScenario {
  MIXED_SESSIONS = 'mixed',  // Past and future sessions
  ONLY_PAST = 'only_past'    // Only past sessions
}

// Generate a set of mock sessions for development
export const generateMockSessions = (scenario: MockDataScenario = MockDataScenario.MIXED_SESSIONS): ExtendedSession[] => {
  switch (scenario) {
    case MockDataScenario.MIXED_SESSIONS:
      return [
        ...generatePastSessions(3),  // 3 past sessions
        ...generateFutureSessions(2) // 2 future sessions
      ]
    
    case MockDataScenario.ONLY_PAST:
      return generatePastSessions(5) // 5 past sessions, no future ones
    
    default:
      return []
  }
}

// Development configuration
export const mockConfig = {
  enabled: false, // Calendar mocking permanently disabled to ensure only live API usage
  scenario: MockDataScenario.MIXED_SESSIONS
} 