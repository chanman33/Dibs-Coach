import { useState, useEffect } from 'react';
import { BrowseCoachData } from '../types/browse-coaches';
import { fetchCoaches } from '@/utils/actions/browse-coaches';
import { fetchBookedCoaches } from '@/utils/actions/your-coaches';
// import { getPublicCoaches } from '@/utils/actions/coaches'; // No longer needed
import { logCoachDataQuality } from '@/utils/logging/coach-logger';

interface PostgrestError {
  code?: string;
  message: string;
  details?: string;
}

interface UseBrowseCoachesProps {
  role: 'COACH' | 'MENTEE';
  isSignedIn: boolean;
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

export function useBrowseCoaches({ role, isSignedIn }: UseBrowseCoachesProps): UseBrowseCoachesReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookedCoaches, setBookedCoaches] = useState<BrowseCoachData[]>([]);
  const [recommendedCoaches, setRecommendedCoaches] = useState<BrowseCoachData[]>([]);
  const [filteredBookedCoaches, setFilteredBookedCoaches] = useState<BrowseCoachData[]>([]);
  const [filteredRecommendedCoaches, setFilteredRecommendedCoaches] = useState<BrowseCoachData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [allSpecialties, setAllSpecialties] = useState<string[]>([]);

  useEffect(() => {
    const getCoaches = async () => {
      setError(null);
      setIsLoading(true);
      try {
        // Fetch all coaches
        const { data: coachesData, error: fetchError } = await fetchCoaches(null);

        if (fetchError) {
          console.error('[USE_BROWSE_COACHES_FETCH_ERROR]', { fetchError, isSignedIn, role });
          setError('Unable to fetch coaches. Please try again later.');
          setBookedCoaches([]);
          setRecommendedCoaches([]);
          setFilteredBookedCoaches([]);
          setFilteredRecommendedCoaches([]);
          setAllSpecialties([]);
          return;
        }

        if (!coachesData || !Array.isArray(coachesData)) {
          console.error('[USE_BROWSE_COACHES_INVALID_DATA]', { coachesData, isSignedIn, role });
          setError('Invalid data received from server');
          setBookedCoaches([]);
          setRecommendedCoaches([]);
          setFilteredBookedCoaches([]);
          setFilteredRecommendedCoaches([]);
          setAllSpecialties([]);
          return;
        }

        // Extract all unique specialties
        const specialties = new Set<string>();
        coachesData.forEach(coach => {
          if (coach.coachSkills && Array.isArray(coach.coachSkills)) {
            coach.coachSkills.forEach(skill => {
              if (skill) specialties.add(skill);
            });
          }
        });
        setAllSpecialties(Array.from(specialties).sort());

        // If user is signed in, fetch their booked coaches
        if (isSignedIn) {
          const { data: bookedCoachesData, error: bookedCoachesError } = await fetchBookedCoaches(null);
          
          if (bookedCoachesError) {
            console.error('[USE_BROWSE_COACHES_BOOKED_COACHES_ERROR]', { 
              error: bookedCoachesError, 
              isSignedIn, 
              role,
              timestamp: new Date().toISOString()
            });
            // Continue without booked coaches
            setBookedCoaches([]);
            setFilteredBookedCoaches([]);
          } else {
            console.log('[USE_BROWSE_COACHES_BOOKED_COACHES]', {
              bookedCoachesCount: bookedCoachesData?.length || 0,
              isSignedIn,
              role,
              timestamp: new Date().toISOString()
            });
            
            setBookedCoaches(bookedCoachesData || []);
            setFilteredBookedCoaches(bookedCoachesData || []);
            
            // Filter recommended coaches to exclude already booked ones
            const bookedCoachIds = new Set((bookedCoachesData || []).map(coach => coach.ulid));
            const filteredRecommended = coachesData.filter(coach => !bookedCoachIds.has(coach.ulid));
            setRecommendedCoaches(filteredRecommended);
            setFilteredRecommendedCoaches(filteredRecommended);
          }
        } else {
          // For public users, no booked coaches
          setBookedCoaches([]);
          setFilteredBookedCoaches([]);
          setRecommendedCoaches(coachesData);
          setFilteredRecommendedCoaches(coachesData);
        }
      } catch (err) {
        const castError = err as Error;
        console.error('[USE_BROWSE_COACHES_UNEXPECTED_ERROR]', {
          error: castError.message,
          stack: castError.stack,
          isSignedIn,
          role
        });
        setError('An unexpected error occurred. Please try again later.');
        setBookedCoaches([]);
        setRecommendedCoaches([]);
        setFilteredBookedCoaches([]);
        setFilteredRecommendedCoaches([]);
        setAllSpecialties([]);
      } finally {
        setIsLoading(false);
      }
    };
    getCoaches();
  }, [role, isSignedIn]);

  // Filter coaches based on search term and specialty
  useEffect(() => {
    const filterLogic = (coaches: BrowseCoachData[]) => {
      return coaches.filter(coach => {
        const nameMatch = searchTerm
          ? `${coach.firstName} ${coach.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        const specialtyMatch = selectedSpecialty
          ? coach.coachSkills?.includes(selectedSpecialty)
          : true;
        return nameMatch && specialtyMatch;
      });
    };
    setFilteredBookedCoaches(filterLogic(bookedCoaches));
    setFilteredRecommendedCoaches(filterLogic(recommendedCoaches));
  }, [searchTerm, selectedSpecialty, bookedCoaches, recommendedCoaches]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilter = (specialty: string) => {
    setSelectedSpecialty(specialty);
  };

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
    allSpecialties
  };
} 