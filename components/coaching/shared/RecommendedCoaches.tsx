'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { CoachCard } from '@/components/coaching/shared/CoachCard'
import { BrowseCoachData } from '@/utils/types/browse-coaches'

interface RecommendedCoachesProps {
  recommendedCoaches: BrowseCoachData[];
  isLoading: boolean;
  onCoachClick: (coach: BrowseCoachData) => void;
}

export function RecommendedCoaches({ 
  recommendedCoaches, 
  isLoading, 
  onCoachClick 
}: RecommendedCoachesProps) {
  
  const getTopRecommendedCoaches = (coaches: BrowseCoachData[], count: number = 10): BrowseCoachData[] => {
    const availableCoaches = coaches.filter(coach => 
      coach.coachSkills && 
      coach.coachSkills.length > 0
    );
    
    return availableCoaches
      .sort((a, b) => {
        const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        
        const experienceDiff = (b.yearsCoaching || 0) - (a.yearsCoaching || 0);
        if (experienceDiff !== 0) return experienceDiff;
        
        return (b.totalSessions || 0) - (a.totalSessions || 0);
      })
      .slice(0, count);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <h2 className="text-2xl font-bold tracking-tight">Recommended Coaches</h2>
      </CardHeader>
      <CardContent className="pt-4 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : recommendedCoaches && recommendedCoaches.length > 0 ? (
          <div className="relative">
            <div className="overflow-x-auto pb-4 -mx-4 px-4" 
                 style={{ scrollbarWidth: 'thin' }}>
              <div className="flex gap-6">
                {getTopRecommendedCoaches(recommendedCoaches).map(coach => (
                  <div key={coach.ulid} className="flex-shrink-0 w-[320px]">
                    <CoachCard
                      id={coach.ulid}
                      userId={coach.userId}
                      name={`${coach.firstName} ${coach.lastName}`}
                      imageUrl={coach.profileImageUrl || ''}
                      specialty={coach.coachSkills?.[0] || 'General Coach'}
                      bio={coach.bio || ''}
                      experience={coach.yearsCoaching 
                        ? `${coach.yearsCoaching} years of coaching experience` 
                        : null}
                      availability={coach.isActive ? "Available" : "Unavailable"}
                      sessionLength={`${coach.defaultDuration} minutes`}
                      coachSkills={coach.coachSkills || []}
                      coachRealEstateDomains={coach.coachRealEstateDomains || []}
                      coachPrimaryDomain={coach.coachPrimaryDomain}
                      isBooked={false}
                      onProfileClick={() => onCoachClick(coach)}
                      sessionConfig={{
                        durations: [
                          coach.minimumDuration,
                          coach.defaultDuration,
                          coach.maximumDuration
                        ].filter(Boolean),
                        rates: {
                          [coach.minimumDuration]: (coach.hourlyRate || 0) * (coach.minimumDuration / 60),
                          [coach.defaultDuration]: (coach.hourlyRate || 0) * (coach.defaultDuration / 60),
                          [coach.maximumDuration]: (coach.hourlyRate || 0) * (coach.maximumDuration / 60)
                        },
                        currency: 'USD',
                        defaultDuration: coach.defaultDuration || 60,
                        allowCustomDuration: coach.allowCustomDuration || false,
                        minimumDuration: coach.minimumDuration || 30,
                        maximumDuration: coach.maximumDuration || 90,
                        isActive: coach.isActive
                      }}
                      profileSlug={coach.profileSlug}
                      isPublic={false}
                      showBookButton={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            No recommended coaches available at the moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
} 