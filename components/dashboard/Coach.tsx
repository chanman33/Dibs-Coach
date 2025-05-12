import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CoachProfileModal } from '../coach-profile/CoachProfileModal'
import { DEFAULT_AVATARS } from '@/utils/constants'
import { SessionConfig } from '@/utils/types/browse-coaches'

const DEFAULT_IMAGE_URL = '/placeholder.svg'

const getImageUrl = (url: string | null, isMockUser: boolean) => {
  // For mock users or missing URLs, use placeholder
  if (isMockUser || !url) return DEFAULT_IMAGE_URL

  // For placeholder images, use our default placeholder
  if (url.includes('placeholder')) return DEFAULT_IMAGE_URL

  // Handle Clerk OAuth URLs
  if (url.includes('oauth_google')) {
    // Try img.clerk.com domain first
    return url.replace('images.clerk.dev', 'img.clerk.com')
  }

  // Handle other Clerk URLs
  if (url.includes('clerk.dev') || url.includes('clerk.com')) {
    return url
  }

  // For all other URLs (like uploadthing), ensure HTTPS
  return url.startsWith('https://') ? url : `https://${url}`
}

interface CoachProps {
  id: string
  userId: string
  name: string
  specialty: string
  imageUrl: string | null
  bio: string | null
  experience: string | null
  certifications: string[] | null
  availability: string | null
  sessionLength: string | null
  specialties: string[]
  calendlyUrl: string | null
  eventTypeUrl: string | null
  isBooked?: boolean
  onProfileClick?: () => void
  sessionConfig: SessionConfig
}

export function Coach(props: CoachProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  
  // Determine if this is a mock user (no real Clerk ID)
  const isMockUser = !props.userId || props.userId === 'mock_user'
  
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(
    getImageUrl(props.imageUrl, isMockUser)
  )

  // Reset error state when imageUrl changes
  useEffect(() => {
    setImgError(false)
    setCurrentImageUrl(getImageUrl(props.imageUrl, isMockUser))
  }, [props.imageUrl, isMockUser])

  const handleImageError = () => {
    console.error(`[IMAGE_ERROR] Failed to load image for ${isMockUser ? 'mock' : 'real'} user:`, {
      originalUrl: props.imageUrl,
      attemptedUrl: currentImageUrl,
      userId: props.userId
    })
    setImgError(true)
    setCurrentImageUrl(DEFAULT_AVATARS.COACH)
  }

  const isPlaceholder = currentImageUrl === DEFAULT_IMAGE_URL

  return (
    <div className="flex flex-col items-center p-6 space-y-4 bg-card rounded-lg shadow-sm">
      <div className="relative w-32 h-32">
        <Image
          src={currentImageUrl}
          alt={`${props.name}'s profile picture`}
          fill
          className="rounded-full object-cover"
          onError={handleImageError}
          priority={!isPlaceholder} // Add priority for real user images
          unoptimized={isPlaceholder}
          sizes="(max-width: 128px) 100vw, 128px"
        />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">{props.name}</h3>
        <p className="text-sm text-muted-foreground">{props.specialty}</p>
      </div>
      <Button onClick={() => setIsModalOpen(true)}>View Profile</Button>
      <CoachProfileModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        coach={{
          ulid: props.id,
          userUlid: props.userId,
          firstName: props.name.split(' ')[0] || '',
          lastName: props.name.split(' ').slice(1).join(' ') || '',
          displayName: props.name,
          bio: props.bio,
          profileImageUrl: props.imageUrl,
          coachSkills: props.specialties,
          hourlyRate: props.sessionConfig?.rates?.["60"] || null,
          sessionConfig: props.sessionConfig
        }}
      />
    </div>
  )
}

