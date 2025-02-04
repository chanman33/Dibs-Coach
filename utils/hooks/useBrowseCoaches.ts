import { useState, useEffect } from 'react';
import { BrowseCoachData } from '../types/browse-coaches';
import { fetchCoaches } from '@/app/api/user/coach/route';

interface PostgrestError {
  code?: string;
  message: string;
  details?: string;
}

interface UseBrowseCoachesProps {
  role: 'coach' | 'mentee';
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
          const profile = Array.isArray(coach.RealtorCoachProfile) 
            ? coach.RealtorCoachProfile[0] 
            : coach.RealtorCoachProfile;

          return {
            id: coach.id,
            userId: coach.userId,
            name: `${coach.firstName || ''} ${coach.lastName || ''}`.trim(),
            strength: profile?.specialty || 'General Coach',
            imageUrl: coach.profileImageUrl,
            bio: profile?.bio,
            experience: profile?.experience,
            certifications: profile?.certifications || [],
            availability: profile?.availability,
            sessionLength: profile?.sessionLength,
            specialties: profile?.specialties ? JSON.parse(profile.specialties) : [],
            calendlyUrl: profile?.calendlyUrl,
            eventTypeUrl: profile?.eventTypeUrl,
            rate: profile?.hourlyRate ? parseFloat(profile.hourlyRate.toString()) : null
          };
        });

        // Filter out any coaches with invalid/incomplete data
        const validCoaches = formattedCoaches.filter(coach => 
          coach.name && coach.strength && (!coach.specialties || Array.isArray(coach.specialties))
        );

        setBookedCoaches(validCoaches.slice(0, 2));
        setRecommendedCoaches(validCoaches.slice(2));
        setFilteredBookedCoaches(validCoaches.slice(0, 2));
        setFilteredRecommendedCoaches(validCoaches.slice(2));
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