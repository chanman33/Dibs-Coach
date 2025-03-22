'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicCoach, RealEstateDomain } from '@/utils/types/coach'

interface SimilarCoachesProps {
  currentCoachId: string;
  skills: string[];
  domains: RealEstateDomain[];
}

export function SimilarCoaches({ currentCoachId, skills, domains }: SimilarCoachesProps) {
  const [similarCoaches, setSimilarCoaches] = useState<PublicCoach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    async function fetchSimilarCoaches() {
      try {
        setIsLoading(true);
        
        // Find coaches with similar skills or domains
        const { data, error } = await supabase
          .from('CoachProfile')
          .select(`
            ulid,
            userUlid,
            coachSkills,
            coachRealEstateDomains,
            coachPrimaryDomain,
            hourlyRate,
            averageRating,
            totalSessions,
            slogan,
            profileSlug,
            isActive,
            User (
              firstName,
              lastName,
              displayName,
              profileImageUrl,
              bio
            )
          `)
          .neq('ulid', currentCoachId) // Exclude current coach
          .eq('isActive', true) // Only active coaches
          .limit(4); // Limit to 4 similar coaches
        
        if (error) {
          console.error('[SIMILAR_COACHES_ERROR]', error);
          return;
        }
        
        if (!data || data.length === 0) {
          setIsLoading(false);
          return;
        }
        
        // Transform data to match PublicCoach type
        const transformedCoaches = data.map((coach: any) => ({
          ulid: coach.ulid,
          userUlid: coach.userUlid,
          firstName: coach.User?.firstName || '',
          lastName: coach.User?.lastName || '',
          displayName: coach.User?.displayName || `${coach.User?.firstName || ''} ${coach.User?.lastName || ''}`.trim(),
          bio: coach.User?.bio || '',
          profileImageUrl: coach.User?.profileImageUrl || '',
          slogan: coach.slogan || null,
          coachSkills: coach.coachSkills || [],
          coachRealEstateDomains: coach.coachRealEstateDomains || [],
          coachPrimaryDomain: coach.coachPrimaryDomain || null,
          hourlyRate: coach.hourlyRate || null,
          averageRating: coach.averageRating || null,
          totalSessions: coach.totalSessions || 0,
          profileSlug: coach.profileSlug || null,
          sessionConfig: {
            defaultDuration: 60,
            minimumDuration: 30,
            maximumDuration: 90,
            allowCustomDuration: false
          }
        }));
        
        // Sort by relevance (number of matching skills and domains)
        const sortedCoaches = transformedCoaches.sort((a, b) => {
          const aMatchingSkills = a.coachSkills.filter((skill: string) => skills.includes(skill)).length;
          const bMatchingSkills = b.coachSkills.filter((skill: string) => skills.includes(skill)).length;
          
          const aMatchingDomains = a.coachRealEstateDomains.filter((domain: RealEstateDomain) => domains.includes(domain)).length;
          const bMatchingDomains = b.coachRealEstateDomains.filter((domain: RealEstateDomain) => domains.includes(domain)).length;
          
          return (bMatchingSkills + bMatchingDomains) - (aMatchingSkills + aMatchingDomains);
        });
        
        setSimilarCoaches(sortedCoaches);
      } catch (err) {
        console.error('[SIMILAR_COACHES_ERROR]', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSimilarCoaches();
  }, [currentCoachId, skills, domains, supabase]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (similarCoaches.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No similar coaches found at the moment.
      </p>
    );
  }
  
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold mb-6">Similar Coaches</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {similarCoaches
          .slice(0, 3) // Limit to exactly 3 coaches 
          .map(coach => (
          <Card key={coach.ulid} className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  {coach.profileImageUrl ? (
                    <Image 
                      src={coach.profileImageUrl} 
                      alt={coach.displayName || `${coach.firstName} ${coach.lastName}`} 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {coach.firstName?.[0]}{coach.lastName?.[0]}
                    </div>
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">{coach.displayName || `${coach.firstName} ${coach.lastName}`}</CardTitle>
                  <CardDescription className="text-xs truncate">
                    {coach.coachSkills?.[0] || 'Coach'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow pb-4">
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{coach.bio || 'No bio available'}</p>
              
              {coach.coachSkills && coach.coachSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {coach.coachSkills.slice(0, 2).map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                  {coach.coachSkills.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{coach.coachSkills.length - 2} more
                    </span>
                  )}
                </div>
              )}
              
              <Link href={`/profile/${coach.profileSlug || coach.ulid}`} className="block w-full">
                <Button 
                  className="w-full mt-2" 
                  variant="outline"
                  size="sm"
                >
                  View Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 