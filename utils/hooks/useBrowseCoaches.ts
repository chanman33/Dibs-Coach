import { useState, useEffect } from 'react';
import { BrowseCoachData } from '../types/browse-coaches';
import { fetchCoaches } from '@/utils/actions/browse-coaches';

interface PostgrestError {
  code?: string;
  message: string;
  details?: string;
}

interface UseBrowseCoachesProps {
  role: 'COACH' | 'MENTEE';
}

interface UseBrowseCoachesReturn {
  isLoading: boolean;
  error: string | null;
  bookedCoaches: BrowseCoachData[];
  recommendedCoaches: BrowseCoachData[];
  filteredBookedCoaches: BrowseCoachData[];
  filteredRecommendedCoaches: BrowseCoachData[];
  searchTerm: string;
  selectedSpecialty: string;
  handleSearch: (term: string) => void;
  handleFilter: (specialty: string) => void;
  allSpecialties: string[];
}

export function useBrowseCoaches({ role }: UseBrowseCoachesProps): UseBrowseCoachesReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookedCoaches, setBookedCoaches] = useState<BrowseCoachData[]>([]);
  const [recommendedCoaches, setRecommendedCoaches] = useState<BrowseCoachData[]>([]);
  const [filteredBookedCoaches, setFilteredBookedCoaches] = useState<BrowseCoachData[]>([]);
  const [filteredRecommendedCoaches, setFilteredRecommendedCoaches] = useState<BrowseCoachData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  useEffect(() => {
    const getCoaches = async () => {
      try {
        setError(null);
        const { data: coachesData, error: fetchError } = await fetchCoaches(null);
        
        if (fetchError) {
          // Check if it's a PGRST200 error (no results)
          const pgError = fetchError as PostgrestError;
          if (pgError.code === 'PGRST200') {
            // This is not really an error, just no coaches yet
            setBookedCoaches([]);
            setRecommendedCoaches([]);
            setFilteredBookedCoaches([]);
            setFilteredRecommendedCoaches([]);
            return;
          }
          
          console.error('[FETCH_COACHES_ERROR]', fetchError);
          setError('Unable to fetch coaches. Please try again later.');
          return;
        }

        if (!coachesData || !Array.isArray(coachesData)) {
          setError('Invalid data received from server');
          return;
        }

        const formattedCoaches: BrowseCoachData[] = coachesData.map(coach => ({
          ulid: coach.ulid,
          userId: coach.userId,
          firstName: coach.firstName,
          lastName: coach.lastName,
          profileImageUrl: coach.profileImageUrl,
          bio: coach.bio,
          coachingSpecialties: coach.coachingSpecialties || [],
          hourlyRate: coach.hourlyRate,
          yearsCoaching: coach.yearsCoaching,
          totalSessions: coach.totalSessions,
          averageRating: coach.averageRating,
          defaultDuration: coach.defaultDuration,
          minimumDuration: coach.minimumDuration,
          maximumDuration: coach.maximumDuration,
          allowCustomDuration: coach.allowCustomDuration,
          isActive: coach.isActive,
          calendlyUrl: coach.calendlyUrl,
          eventTypeUrl: coach.eventTypeUrl
        }));

        // Filter out any coaches with invalid/incomplete data
        const validCoaches = formattedCoaches.filter(coach => 
          coach.firstName && coach.lastName && coach.isActive
        );

        // Sort coaches by those with complete profiles first and calculate recommendation scores
        const sortedCoaches = validCoaches.sort((a, b) => {
          // Calculate profile completeness score (40%)
          const getCompletenessScore = (coach: BrowseCoachData) => {
            let score = 0;
            if (coach.bio) score += 0.1;
            if (coach.coachingSpecialties?.length) score += 0.1;
            if (coach.hourlyRate) score += 0.1;
            if (coach.profileImageUrl) score += 0.1;
            return score;
          };

          // Calculate experience score (30%)
          const getExperienceScore = (coach: BrowseCoachData) => {
            let score = 0;
            // Years of coaching (up to 10 years = max score)
            score += Math.min((coach.yearsCoaching || 0) / 10, 1) * 0.15;
            // Total sessions (up to 100 sessions = max score)
            score += Math.min((coach.totalSessions || 0) / 100, 1) * 0.15;
            return score;
          };

          // Calculate rating score (30%)
          const getRatingScore = (coach: BrowseCoachData) => {
            return ((coach.averageRating || 0) / 5) * 0.3;
          };

          const aScore = getCompletenessScore(a) + getExperienceScore(a) + getRatingScore(a);
          const bScore = getCompletenessScore(b) + getExperienceScore(b) + getRatingScore(b);
          
          return bScore - aScore; // Higher score first
        });

        // Get booked coaches (this would normally come from a separate query)
        const userBookedCoaches = sortedCoaches.slice(0, 2);
        
        // Get recommended coaches based on comprehensive scoring
        const recommendedCoaches = sortedCoaches
          .filter(coach => !userBookedCoaches.some(booked => booked.ulid === coach.ulid))
          .sort((a, b) => {
            // Calculate recommendation score based on:
            // - Profile completeness (40%)
            // - Experience and sessions (30%)
            // - Rating (30%)
            const getScore = (coach: BrowseCoachData) => {
              const completenessScore = (
                (coach.bio ? 0.1 : 0) +
                (coach.coachingSpecialties?.length ? 0.1 : 0) +
                (coach.hourlyRate ? 0.1 : 0) +
                (coach.profileImageUrl ? 0.1 : 0)
              );

              const experienceScore = (
                Math.min((coach.yearsCoaching || 0) / 10, 1) * 0.15 +
                Math.min((coach.totalSessions || 0) / 100, 1) * 0.15
              );

              const ratingScore = ((coach.averageRating || 0) / 5) * 0.3;

              return completenessScore + experienceScore + ratingScore;
            };

            return getScore(b) - getScore(a); // Higher score first
          });

        setBookedCoaches(userBookedCoaches);
        setRecommendedCoaches(recommendedCoaches);
        setFilteredBookedCoaches(userBookedCoaches);
        setFilteredRecommendedCoaches(recommendedCoaches);
      } catch (error) {
        console.error('[FETCH_COACHES_ERROR]', error);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    getCoaches();
  }, []);

  const filterCoaches = (term: string, specialty: string) => {
    const filterFunction = (coach: BrowseCoachData) => {
      const fullName = `${coach.firstName} ${coach.lastName}`.toLowerCase();
      const searchMatch = fullName.includes(term.toLowerCase()) ||
        (coach.bio || '').toLowerCase().includes(term.toLowerCase());
      
      return searchMatch && (
        specialty === 'all' || 
        coach.coachingSpecialties?.includes(specialty)
      );
    };

    setFilteredBookedCoaches(bookedCoaches.filter(filterFunction));
    setFilteredRecommendedCoaches(recommendedCoaches.filter(filterFunction));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterCoaches(term, selectedSpecialty);
  };

  const handleFilter = (specialty: string) => {
    setSelectedSpecialty(specialty);
    filterCoaches(searchTerm, specialty);
  };

  const allSpecialties = Array.from(
    new Set(
      [...bookedCoaches, ...recommendedCoaches]
        .flatMap(coach => coach.coachingSpecialties || [])
    )
  );

  return {
    isLoading,
    error,
    bookedCoaches,
    recommendedCoaches,
    filteredBookedCoaches,
    filteredRecommendedCoaches,
    searchTerm,
    selectedSpecialty,
    handleSearch,
    handleFilter,
    allSpecialties,
  };
} 