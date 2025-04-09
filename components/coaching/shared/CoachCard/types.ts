import { RealEstateDomain } from "@/utils/types/coach";

export interface BaseCoachCardProps {
  id: string;
  name: string;
  imageUrl: string;
  specialty: string;
  bio: string;
  renderFooter?: () => React.ReactNode;
}

export interface SessionConfig {
  durations: number[];
  rates: Record<string, number>;
  currency: string;
  defaultDuration: number;
  allowCustomDuration: boolean;
  minimumDuration: number;
  maximumDuration: number;
  isActive: boolean;
}

export interface PrivateCoachCardProps extends BaseCoachCardProps {
  userId: string;
  coachSkills: string[];
  coachRealEstateDomains?: RealEstateDomain[];
  coachPrimaryDomain?: RealEstateDomain | null;
  experience: string | null;
  certifications: string[];
  availability: string;
  sessionLength: string;
  isBooked: boolean;
  onProfileClick: () => void;
  sessionConfig: SessionConfig;
  profileSlug?: string | null;
}

export interface PublicCoachCardProps extends BaseCoachCardProps {
  coachSkills: string[];
  coachRealEstateDomains?: RealEstateDomain[];
  coachPrimaryDomain?: RealEstateDomain | null;
  rating?: number;
  reviewCount?: number;
  hourlyRate?: number | null;
  sessionConfig?: SessionConfig;
  profileSlug?: string | null;
}

export interface CoachCardProps extends BaseCoachCardProps {
  // Common props from both card types
  coachSkills: string[];
  coachRealEstateDomains?: RealEstateDomain[];
  coachPrimaryDomain?: RealEstateDomain | null;
  profileSlug?: string | null;
  sessionConfig?: SessionConfig;
  
  // Public card specific props
  rating?: number;
  reviewCount?: number;
  hourlyRate?: number | null;
  
  // Private card specific props
  userId?: string;
  experience?: string | null;
  certifications?: string[];
  availability?: string;
  sessionLength?: string;
  isBooked?: boolean;
  onProfileClick?: () => void;
  
  // Visibility control
  showBookButton?: boolean;
  isPublic?: boolean;
} 