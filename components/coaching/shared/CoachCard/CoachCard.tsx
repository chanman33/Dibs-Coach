import { Button } from '@/components/ui/button'
import { BaseCoachCard } from '.'
import { CoachCardProps } from './types'
import { Calendar, Clock, Briefcase, Building, Home } from 'lucide-react'
import { useState, useEffect } from 'react'
import { BookingModal } from '../BookingModal'
import { RatingDisplay } from '../RatingDisplay'
import { RealEstateDomain } from '@/utils/types/coach'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

// Helper function to get icon for real estate domain
const getDomainIcon = (domain: RealEstateDomain) => {
  switch (domain) {
    case 'REALTOR':
      return <Home className="h-3 w-3" />;
    case 'COMMERCIAL':
      return <Building className="h-3 w-3" />;
    default:
      return <Briefcase className="h-3 w-3" />;
  }
};

// Helper function to format domain names for display
const formatDomain = (domain: RealEstateDomain): string => {
  return domain
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

export function CoachCard({
  // Base props
  name,
  imageUrl,
  specialty,
  bio,
  id,
  
  // Common props
  coachSkills = [],
  coachRealEstateDomains = [],
  coachPrimaryDomain,
  profileSlug,
  sessionConfig,
  
  // Public card specific props
  rating,
  reviewCount,
  hourlyRate,
  
  // Private card specific props
  userId,
  experience,
  availability,
  sessionLength,
  isBooked = false,
  onProfileClick,
  
  // Visibility control
  showBookButton = false,
  isPublic = true,
  
  ...otherProps
}: CoachCardProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  // Determine the profile path - use profileSlug if available, otherwise use id
  const profilePath = profileSlug || id;
  
  // Default session config for public coaches
  const defaultSessionConfig = {
    durations: [60],
    rates: { '60': hourlyRate ?? 0 },
    currency: 'USD',
    defaultDuration: 60,
    allowCustomDuration: false,
    minimumDuration: 60,
    maximumDuration: 60,
    isActive: true
  };
  
  // Use provided session config or default
  const finalSessionConfig = sessionConfig ?? defaultSessionConfig;

  // Handle navigation to coach profile
  const handleProfileClick = () => {
    try {
      // Log navigation event with detailed context
      console.log('[COACH_CARD_NAVIGATION]', {
        action: 'view_profile',
        from: pathname,
        to: `/profile/${profilePath}`,
        coachId: id,
        coachName: name,
        timestamp: new Date().toISOString()
      });
      
      // If in private mode and there's a profile click handler, use it
      if (!isPublic && onProfileClick) {
        onProfileClick();
        return;
      }
    } catch (error) {
      console.error('[COACH_CARD_NAVIGATION_ERROR]', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        coachId: id,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Filter domains to avoid duplicating the primary domain in secondary domains list
  const secondaryDomains = coachRealEstateDomains.filter(
    domain => domain !== coachPrimaryDomain
  );

  return (
    <>
      <BaseCoachCard
        name={name}
        imageUrl={imageUrl}
        specialty={specialty}
        bio={bio}
        id={id}
        renderFooter={() => (
          <div className="w-full space-y-4">
            {/* Rating display (public mode) */}
            {isPublic && rating !== undefined && reviewCount !== undefined && (
              <RatingDisplay 
                rating={rating} 
                reviewCount={reviewCount}
                size="sm"
                showNewCoachBadge={reviewCount === 0}
              />
            )}
            
            {/* Domains section - showing primary and secondary domains in one row */}
            {(coachPrimaryDomain || secondaryDomains.length > 0) && (
              <div className="flex flex-wrap items-start gap-2">
                {/* Primary Domain Badge */}
                {coachPrimaryDomain && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    {getDomainIcon(coachPrimaryDomain)}
                    <span>{formatDomain(coachPrimaryDomain)}</span>
                  </Badge>
                )}
                
                {/* Secondary Domains Badges */}
                {secondaryDomains.map(domain => (
                  <Badge 
                    key={domain} 
                    variant="secondary" 
                    className="text-xs flex items-center gap-1 bg-muted text-muted-foreground"
                  >
                    {getDomainIcon(domain)}
                    <span>{formatDomain(domain)}</span>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Session and availability info (private mode) */}
            {!isPublic && sessionLength && availability && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Session: {sessionLength}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Availability: {availability}</span>
                </div>
              </div>
            )}
            
            {/* Skills section */}
            {coachSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {coachSkills.slice(0, 3).map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {skill}
                  </span>
                ))}
                {!isPublic && coachSkills.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{coachSkills.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-2">
              <Link 
                href={`/profile/${profilePath}${isPublic ? `?from=${encodeURIComponent(pathname)}` : ''}`} 
                className="block w-full" 
                onClick={handleProfileClick}
              >
                <Button 
                  className="w-full" 
                  variant="secondary"
                >
                  View Profile
                </Button>
              </Link>
              
              {/* Booking button - conditionally rendered */}
              {showBookButton && !isBooked && (
                <Button 
                  className="w-full" 
                  onClick={() => setIsBookingModalOpen(true)}
                  disabled={!finalSessionConfig.isActive}
                >
                  {!finalSessionConfig.isActive ? "Not Available" : "Book Session"}
                </Button>
              )}
            </div>
          </div>
        )}
        {...otherProps}
      />

      {showBookButton && !isBooked && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          coachName={name}
          sessionConfig={finalSessionConfig}
          coachId={id}
          profileSlug={profileSlug || undefined}
        />
      )}
    </>
  )
} 