import { useState, useEffect } from 'react';
import { BrowseCoachData } from '../types/browse-coaches';
import { fetchCoaches } from '@/utils/actions/browse-coaches';
import { logCoachDataQuality } from '@/utils/logging/coach-logger';

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
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [allSpecialties, setAllSpecialties] = useState<string[]>([]);

  useEffect(() => {
    const getCoaches = async () => {
      console.log('[CLIENT_BROWSE_COACHES_START]', { 
        role,
        timestamp: new Date().toISOString()
      });
      
      try {
        setError(null);
        console.log('[CLIENT_BROWSE_COACHES_FETCH_START]');
        const { data: coachesData, error: fetchError } = await fetchCoaches(null);
        console.log('[CLIENT_BROWSE_COACHES_FETCH_COMPLETE]', {
          success: !fetchError,
          dataReceived: !!coachesData,
          coachCount: coachesData?.length || 0,
          timestamp: new Date().toISOString()
        });
        
        // Log the raw data to help debug
        if (coachesData && coachesData.length > 0) {
          console.log('[CLIENT_BROWSE_COACHES_FIRST_COACH]', {
            coach: coachesData[0],
            timestamp: new Date().toISOString()
          });
        }
        
        if (fetchError) {
          console.error('[CLIENT_BROWSE_COACHES_ERROR]', {
            error: fetchError,
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            timestamp: new Date().toISOString()
          });
          setError('Unable to fetch coaches. Please try again later.');
          return;
        }

        if (!coachesData || !Array.isArray(coachesData)) {
          console.error('[CLIENT_BROWSE_COACHES_INVALID_DATA]', {
            dataType: typeof coachesData,
            isArray: Array.isArray(coachesData),
            timestamp: new Date().toISOString()
          });
          setError('Invalid data received from server');
          return;
        }
        
        if (coachesData.length === 0) {
          console.log('[CLIENT_BROWSE_COACHES_NO_COACHES]', {
            timestamp: new Date().toISOString()
          });
          setBookedCoaches([]);
          setRecommendedCoaches([]);
          setFilteredBookedCoaches([]);
          setFilteredRecommendedCoaches([]);
          setAllSpecialties([]);
          return;
        }

        console.log('[CLIENT_BROWSE_COACHES_TRANSFORM_START]', {
          coachCount: coachesData.length,
          timestamp: new Date().toISOString()
        });

        // The data is already transformed by the server action
        const validCoaches = coachesData.filter(coach => 
          coach.firstName && coach.lastName && coach.isActive
        );

        console.log('[CLIENT_BROWSE_COACHES_VALID_COACHES]', {
          total: coachesData.length,
          valid: validCoaches.length,
          invalid: coachesData.length - validCoaches.length,
          timestamp: new Date().toISOString()
        });

        // Sort coaches by those with complete profiles first and calculate recommendation scores
        console.log('[CLIENT_BROWSE_COACHES_SORTING_START]', {
          timestamp: new Date().toISOString()
        });

        // Extract all unique specialties
        const specialties = new Set<string>();
        validCoaches.forEach(coach => {
          if (coach.coachingSpecialties && Array.isArray(coach.coachingSpecialties)) {
            coach.coachingSpecialties.forEach(specialty => {
              if (specialty) specialties.add(specialty);
            });
          }
        });
        
        setAllSpecialties(Array.from(specialties).sort());

        // For now, just split into booked and recommended
        // In a real app, we'd use actual booking data and recommendation algorithms
        const booked: BrowseCoachData[] = [];
        const recommended = [...validCoaches];
        
        // Sort recommended coaches by rating and completeness
        recommended.sort((a, b) => {
          // First by rating (if available)
          if (a.averageRating && b.averageRating) {
            return b.averageRating - a.averageRating;
          } else if (a.averageRating) {
            return -1; // a has rating, b doesn't
          } else if (b.averageRating) {
            return 1; // b has rating, a doesn't
          }
          
          // Then by total sessions
          return (b.totalSessions || 0) - (a.totalSessions || 0);
        });

        console.log('[CLIENT_BROWSE_COACHES_SORTING_COMPLETE]', {
          bookedCount: booked.length,
          recommendedCount: recommended.length,
          timestamp: new Date().toISOString()
        });

        setBookedCoaches(booked);
        setRecommendedCoaches(recommended);
        setFilteredBookedCoaches(booked);
        setFilteredRecommendedCoaches(recommended);
      } catch (error) {
        console.error('[CLIENT_BROWSE_COACHES_UNEXPECTED_ERROR]', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    getCoaches();
  }, [role]);

  // Filter coaches based on search term and specialty
  useEffect(() => {
    console.log('[CLIENT_BROWSE_COACHES_FILTERING]', {
      searchTerm,
      selectedSpecialty,
      timestamp: new Date().toISOString()
    });
    
    const filterCoaches = (coaches: BrowseCoachData[]) => {
      return coaches.filter(coach => {
        // Filter by search term
        const nameMatch = searchTerm 
          ? `${coach.firstName} ${coach.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        
        // Filter by specialty
        const specialtyMatch = selectedSpecialty
          ? coach.coachingSpecialties?.includes(selectedSpecialty)
          : true;
        
        return nameMatch && specialtyMatch;
      });
    };
    
    setFilteredBookedCoaches(filterCoaches(bookedCoaches));
    setFilteredRecommendedCoaches(filterCoaches(recommendedCoaches));
  }, [searchTerm, selectedSpecialty, bookedCoaches, recommendedCoaches]);

  const handleSearch = (term: string) => {
    console.log('[CLIENT_BROWSE_COACHES_SEARCH]', {
      term,
      timestamp: new Date().toISOString()
    });
    setSearchTerm(term);
  };

  const handleFilter = (specialty: string) => {
    console.log('[CLIENT_BROWSE_COACHES_FILTER]', {
      specialty,
      timestamp: new Date().toISOString()
    });
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