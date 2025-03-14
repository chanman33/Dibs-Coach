import { Button } from '@/components/ui/button'
import { BaseCoachCard } from '.'
import { PrivateCoachCardProps } from './types'
import { Calendar, Clock, Briefcase, Building, Home } from 'lucide-react'
import { useState } from 'react'
import { CoachProfileModal } from '../CoachProfileModal'
import { BookingModal } from '../BookingModal'
import { RealEstateDomain } from '@/utils/types/coach'

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

export function PrivateCoachCard({
  coachSkills,
  coachRealEstateDomains,
  coachPrimaryDomain,
  sessionLength,
  availability,
  isBooked,
  onProfileClick,
  sessionConfig,
  ...baseProps
}: PrivateCoachCardProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const baseRate = sessionConfig.rates[sessionConfig.defaultDuration.toString()] || 0

  const handleActionClick = () => {
    if (isBooked) {
      setIsProfileModalOpen(true)
    } else {
      setIsBookingModalOpen(true)
    }
  }

  return (
    <>
      <BaseCoachCard
        {...baseProps}
        renderFooter={() => (
          <div className="w-full space-y-4">
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
                {coachSkills.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{coachSkills.length - 3} more
                  </span>
                )}
              </div>
            )}
            
            {/* Real Estate Domains section */}
            {coachRealEstateDomains && coachRealEstateDomains.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {coachRealEstateDomains.slice(0, 2).map(domain => (
                  <span
                    key={domain}
                    className={`inline-flex items-center gap-1 rounded-full ${domain === coachPrimaryDomain ? 'bg-secondary/20 text-secondary-foreground' : 'bg-muted text-muted-foreground'} px-2.5 py-0.5 text-xs font-medium`}
                  >
                    {getDomainIcon(domain)}
                    {domain.charAt(0) + domain.slice(1).toLowerCase().replace('_', ' ')}
                    {domain === coachPrimaryDomain && ' (Primary)'}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 mt-2">
              <Button 
                className="w-full" 
                variant="secondary"
                onClick={() => setIsProfileModalOpen(true)}
              >
                View Profile
              </Button>
              
              {!isBooked && (
                <Button 
                  className="w-full" 
                  onClick={() => setIsBookingModalOpen(true)}
                  disabled={!sessionConfig.isActive}
                >
                  {!sessionConfig.isActive ? "Not Available" : "Book Session"}
                </Button>
              )}
            </div>
          </div>
        )}
      />

      <CoachProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        coach={{
          firstName: baseProps.name.split(' ')[0],
          lastName: baseProps.name.split(' ').slice(1).join(' '),
          profileImageUrl: baseProps.imageUrl,
          bio: baseProps.bio,
          coachSkills: coachSkills,
          hourlyRate: baseRate,
          sessionConfig
        }}
      />

      {!isBooked && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          coachName={baseProps.name}
          sessionConfig={sessionConfig}
        />
      )}
    </>
  )
} 