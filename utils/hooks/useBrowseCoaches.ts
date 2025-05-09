import { useState, useEffect } from 'react';
import { BrowseCoachData } from '../types/browse-coaches';
import { fetchCoaches } from '@/utils/actions/browse-coaches';
import { getPublicCoaches } from '@/utils/actions/coaches';
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
        let coachesData: BrowseCoachData[] = [];
        let fetchError: any = null;
        if (!isSignedIn) {
          // Public fetch
          const { data, error } = await getPublicCoaches();
          console.log('[PUBLIC_FETCH_RESULT]', { data, error });
          // Map PublicCoach to BrowseCoachData
          coachesData = (data || []).map((coach) => ({
            ulid: coach.ulid,
            userId: coach.userUlid, // userUlid as userId for compatibility
            firstName: coach.firstName || '',
            lastName: coach.lastName || '',
            profileImageUrl: coach.profileImageUrl || null,
            bio: coach.bio || null,
            coachSkills: coach.coachSkills || [],
            coachRealEstateDomains: coach.coachRealEstateDomains || [],
            coachPrimaryDomain: coach.coachPrimaryDomain || null,
            hourlyRate: coach.hourlyRate ?? null,
            isActive: true, // Assume public coaches are active
            yearsCoaching: null, // Not available in PublicCoach
            totalSessions: coach.totalSessions || 0,
            averageRating: coach.averageRating ?? null,
            defaultDuration: coach.sessionConfig?.defaultDuration || 60,
            minimumDuration: coach.sessionConfig?.minimumDuration || 30,
            maximumDuration: coach.sessionConfig?.maximumDuration || 90,
            allowCustomDuration: coach.sessionConfig?.allowCustomDuration || false,
            slogan: coach.slogan || null,
            profileStatus: 'PUBLISHED',
            completionPercentage: 100, // Assume 100 for public
            profileSlug: coach.profileSlug || null,
          }));
          fetchError = error;
        } else {
          // Authenticated fetch
          const { data, error } = await fetchCoaches(null);
          coachesData = data || [];
          fetchError = error;
        }
        if (fetchError) {
          setError('Unable to fetch coaches. Please try again later.');
          setBookedCoaches([]);
          setRecommendedCoaches([]);
          setFilteredBookedCoaches([]);
          setFilteredRecommendedCoaches([]);
          setAllSpecialties([]);
          return;
        }
        if (!coachesData || !Array.isArray(coachesData)) {
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
        // For public users, treat all as recommended
        setBookedCoaches([]);
        setRecommendedCoaches(coachesData);
        setFilteredBookedCoaches([]);
        setFilteredRecommendedCoaches(coachesData);
      } catch (error) {
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
    const filterCoaches = (coaches: BrowseCoachData[]) => {
      return coaches.filter(coach => {
        // Filter by search term
        const nameMatch = searchTerm 
          ? `${coach.firstName} ${coach.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        // Filter by specialty
        const specialtyMatch = selectedSpecialty
          ? coach.coachSkills?.includes(selectedSpecialty)
          : true;
        return nameMatch && specialtyMatch;
      });
    };
    setFilteredBookedCoaches(filterCoaches(bookedCoaches));
    setFilteredRecommendedCoaches(filterCoaches(recommendedCoaches));
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