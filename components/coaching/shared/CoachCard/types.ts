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
  specialties: string[];
  experience: string | null;
  certifications: string[];
  availability: string;
  sessionLength: string;
  calendlyUrl: string | null;
  eventTypeUrl: string | null;
  isBooked: boolean;
  onProfileClick: () => void;
  sessionConfig: SessionConfig;
}

export interface PublicCoachCardProps extends BaseCoachCardProps {
  specialties: string[];
  rating?: number;
  reviewCount?: number;
  hourlyRate?: number | null;
  calendlyUrl?: string | null;
  eventTypeUrl?: string | null;
  sessionConfig?: SessionConfig;
} 