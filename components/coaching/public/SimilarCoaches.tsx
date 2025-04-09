'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicCoach, RealEstateDomain } from '@/utils/types/coach'
import { CoachCard } from '../shared/CoachCard'

interface SimilarCoachesProps {
  currentCoachId: string;
  skills: string[];
  domains: RealEstateDomain[];
}

export function SimilarCoaches({ currentCoachId, skills, domains }: SimilarCoachesProps) {
  const [similarCoaches, setSimilarCoaches] = useState<PublicCoach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
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
          .limit(6); // Limit to 6 similar coaches
        
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
  
  // Handle scroll position for arrows
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    };
    
    // Check initial state
    handleScroll();
    
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [similarCoaches]);
  
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };
  
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Similar Coaches</h2>
        
        {similarCoaches.length > 2 && (
          <div className="flex items-center gap-3">
            <button 
              onClick={scrollLeft}
              className={`rounded-full p-2 transition-all ${showLeftArrow 
                ? 'bg-background text-foreground hover:bg-muted' 
                : 'bg-background text-muted-foreground cursor-default opacity-50'}`}
              disabled={!showLeftArrow}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={scrollRight}
              className={`rounded-full p-2 transition-all ${showRightArrow 
                ? 'bg-background text-foreground hover:bg-muted' 
                : 'bg-background text-muted-foreground cursor-default opacity-50'}`}
              disabled={!showRightArrow}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      <div className="relative">
        {/* Left fade gradient */}
        <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {/* Right fade gradient */}
        <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {/* Scrollable container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-4 gap-5 pt-1 -mx-4 px-4 overflow-y-hidden" 
          style={{ 
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none',  /* IE and Edge */
          }}
        >
          {/* Hide scrollbar for Chrome, Safari and Opera */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {similarCoaches.map(coach => (
            <div key={coach.ulid} className="flex-shrink-0 w-[320px]">
              <CoachCard 
                id={coach.ulid}
                name={coach.displayName || `${coach.firstName} ${coach.lastName}`}
                imageUrl={coach.profileImageUrl || ''}
                specialty={coach.coachSkills?.[0] || 'Coach'}
                bio={coach.bio || 'No bio available'}
                coachSkills={coach.coachSkills || []}
                coachRealEstateDomains={coach.coachRealEstateDomains || []}
                coachPrimaryDomain={coach.coachPrimaryDomain}
                rating={coach.averageRating ?? undefined}
                reviewCount={coach.totalSessions}
                hourlyRate={coach.hourlyRate}
                profileSlug={coach.profileSlug}
                isPublic={true}
                showBookButton={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 