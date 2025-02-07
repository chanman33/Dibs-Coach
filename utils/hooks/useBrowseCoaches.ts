import { useState, useEffect } from 'react';
import { BrowseCoachData } from '../types/browse-coaches';
import { fetchCoaches } from '@/app/api/user/coach/route';

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
        const { data: coachesData, error: fetchError } = await fetchCoaches();
        
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

        const formattedCoaches: BrowseCoachData[] = coachesData.map(coach => {
          const coachProfile = coach.CoachProfile;
          const realtorProfile = coach.RealtorProfile;

          // Get primary specialty from coach specialties or default to first specialization
          const primarySpecialty = coachProfile?.coachingSpecialties?.[0] || 
                                 realtorProfile?.specializations?.[0] || 
                                 'General Coach';

          return {
            id: coach.id,
            userId: coach.userId,
            name: `${coach.firstName || ''} ${coach.lastName || ''}`.trim(),
            strength: primarySpecialty,
            imageUrl: coach.profileImageUrl,
            bio: realtorProfile?.bio || null,
            experience: realtorProfile?.yearsExperience?.toString() || coachProfile?.yearsCoaching?.toString() || null,
            certifications: realtorProfile?.certifications || null,
            // Default to 60 minutes if no duration is specified
            availability: '60 minutes',
            sessionLength: '60 minutes',
            specialties: coachProfile?.coachingSpecialties || realtorProfile?.specializations || [],
            calendlyUrl: coachProfile?.calendlyUrl || null,
            eventTypeUrl: coachProfile?.eventTypeUrl || null,
            rate: coachProfile?.hourlyRate ? parseFloat(coachProfile.hourlyRate.toString()) : null
          };
        });

        // Filter out any coaches with invalid/incomplete data
        const validCoaches = formattedCoaches.filter(coach => 
          coach.name && coach.strength && (!coach.specialties || Array.isArray(coach.specialties))
        );

        // Sort coaches by those with complete profiles first
        const sortedCoaches = validCoaches.sort((a, b) => {
          const aComplete = !!(a.bio && a.experience && a.specialties.length && a.rate);
          const bComplete = !!(b.bio && b.experience && b.specialties.length && b.rate);
          if (aComplete && !bComplete) return -1;
          if (!aComplete && bComplete) return 1;
          return 0;
        });

        setBookedCoaches(sortedCoaches.slice(0, 2));
        setRecommendedCoaches(sortedCoaches.slice(2));
        setFilteredBookedCoaches(sortedCoaches.slice(0, 2));
        setFilteredRecommendedCoaches(sortedCoaches.slice(2));
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
    const filterFunction = (coach: BrowseCoachData) =>
      (coach.name.toLowerCase().includes(term.toLowerCase()) ||
       coach.strength.toLowerCase().includes(term.toLowerCase())) &&
      (specialty === 'all' || coach.strength === specialty);

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
    new Set([...bookedCoaches, ...recommendedCoaches].map(coach => coach.strength))
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