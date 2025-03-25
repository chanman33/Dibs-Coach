/**
 * Utility functions for logging coach-related data in a consistent format
 */

/**
 * Log coach profile data with consistent formatting
 */
export function logCoachProfile(context: string, coach: any) {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log(`[${context}]`, {
    ulid: coach.ulid,
    userId: coach.userId,
    name: coach.firstName && coach.lastName ? `${coach.firstName} ${coach.lastName}` : 'Unknown',
    hasProfileImage: !!coach.profileImageUrl,
    hasBio: !!coach.bio,
    specialtiesCount: coach.coachingSpecialties?.length || 0,
    specialties: coach.coachingSpecialties || [],
    hourlyRate: coach.hourlyRate,
    isActive: coach.isActive,
    totalSessions: coach.totalSessions,
    averageRating: coach.averageRating,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log coach data quality issues
 */
export function logCoachDataQuality(context: string, coaches: any[]) {
  const totalCoaches = coaches.length;
  const withProfileImage = coaches.filter(c => !!c.profileImageUrl).length;
  const withBio = coaches.filter(c => !!c.bio).length;
  const withSpecialties = coaches.filter(c => c.coachingSpecialties?.length > 0).length;
  const withHourlyRate = coaches.filter(c => !!c.hourlyRate).length;
  const withRatings = coaches.filter(c => !!c.averageRating).length;
  const withSessions = coaches.filter(c => c.totalSessions > 0).length;
  
  console.log(`[${context}_DATA_QUALITY]`, {
    totalCoaches,
    profileCompleteness: {
      withProfileImage: {
        count: withProfileImage,
        percentage: Math.round((withProfileImage / totalCoaches) * 100)
      },
      withBio: {
        count: withBio,
        percentage: Math.round((withBio / totalCoaches) * 100)
      },
      withSpecialties: {
        count: withSpecialties,
        percentage: Math.round((withSpecialties / totalCoaches) * 100)
      },
      withHourlyRate: {
        count: withHourlyRate,
        percentage: Math.round((withHourlyRate / totalCoaches) * 100)
      },
      withRatings: {
        count: withRatings,
        percentage: Math.round((withRatings / totalCoaches) * 100)
      },
      withSessions: {
        count: withSessions,
        percentage: Math.round((withSessions / totalCoaches) * 100)
      }
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Log coach filtering operations
 */
export function logCoachFiltering(context: string, {
  before,
  after,
  filters
}: {
  before: number,
  after: number,
  filters: Record<string, any>
}) {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log(`[${context}_FILTERING]`, {
    before,
    after,
    filtered: before - after,
    filterPercentage: Math.round(((before - after) / before) * 100),
    filters,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log coach query parameters
 */
export function logCoachQuery(context: string, {
  table,
  joins,
  filters,
  order
}: {
  table: string,
  joins?: string[],
  filters?: Record<string, any>,
  order?: Record<string, string>
}) {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log(`[${context}_QUERY]`, {
    table,
    joins,
    filters,
    order,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log coach query results
 */
export function logCoachQueryResults(context: string, {
  success,
  count,
  error
}: {
  success: boolean,
  count: number,
  error?: any
}) {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log(`[${context}_QUERY_RESULTS]`, {
    success,
    count,
    error,
    timestamp: new Date().toISOString()
  });
} 