'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { notFound } from 'next/navigation'
import { Loader2, Calendar, Clock, DollarSign, Star, Award, Users, Mail } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RatingDisplay } from '@/components/coaching/shared/RatingDisplay'
import { BookingModal } from '@/components/coaching/shared/BookingModal'
import { PublicCoach, RealEstateDomain } from '@/utils/types/coach'

export default function CoachProfilePage({ params }: { params: { id: string } }) {
  const [coach, setCoach] = useState<PublicCoach | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCoachProfile() {
      try {
        setIsLoading(true)
        
        // First get the coach profile
        const { data: profileData, error: profileError } = await supabase
          .from('CoachProfile')
          .select(`
            ulid,
            userUlid,
            coachSkills,
            hourlyRate,
            averageRating,
            totalSessions,
            coachRealEstateDomains,
            coachPrimaryDomain,
            slogan,
            defaultDuration,
            minimumDuration,
            maximumDuration,
            allowCustomDuration,
            isActive,
            profileStatus
          `)
          .eq('ulid', params.id)
          .eq('isActive', true)
          .eq('profileStatus', 'PUBLISHED')
          .single()
          
        if (profileError) {
          console.error('[COACH_PROFILE_ERROR]', profileError)
          setError('Failed to load coach profile')
          return
        }
        
        if (!profileData) {
          notFound()
          return
        }
        
        // Then get the user data
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select(`
            ulid,
            firstName,
            lastName,
            displayName,
            profileImageUrl,
            bio
          `)
          .eq('ulid', profileData.userUlid)
          .single()
          
        if (userError) {
          console.error('[COACH_USER_ERROR]', userError)
          setError('Failed to load coach information')
          return
        }
        
        if (!userData) {
          notFound()
          return
        }
        
        // Combine the data
        const coachData: PublicCoach = {
          ulid: profileData.ulid,
          userUlid: userData.ulid,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          displayName: userData.displayName || '',
          profileImageUrl: userData.profileImageUrl || '',
          bio: userData.bio || '',
          coachSkills: profileData.coachSkills || [],
          coachRealEstateDomains: profileData.coachRealEstateDomains || [],
          coachPrimaryDomain: profileData.coachPrimaryDomain || null,
          hourlyRate: profileData.hourlyRate || null,
          averageRating: profileData.averageRating || null,
          totalSessions: profileData.totalSessions || 0,
          slogan: profileData.slogan || null,
          sessionConfig: {
            defaultDuration: profileData.defaultDuration || 60,
            minimumDuration: profileData.minimumDuration || 30,
            maximumDuration: profileData.maximumDuration || 90,
            allowCustomDuration: profileData.allowCustomDuration || false
          }
        }
        
        setCoach(coachData)
      } catch (err) {
        console.error('[COACH_PROFILE_EXCEPTION]', err)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCoachProfile()
  }, [params.id, supabase])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !coach) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error || 'Failed to load coach profile'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = `${coach.firstName} ${coach.lastName}`.trim()
  const displayName = coach.displayName || fullName
  const skills = coach.coachSkills || []
  const domains = coach.coachRealEstateDomains || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-primary/10">
                  {coach.profileImageUrl ? (
                    <Image 
                      src={coach.profileImageUrl} 
                      alt={displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                      {fullName.charAt(0)}
                    </div>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold">{displayName}</h1>
                
                {coach.slogan && (
                  <p className="text-muted-foreground mt-1">
                    {coach.slogan}
                  </p>
                )}
                
                {coach.coachPrimaryDomain && (
                  <Badge variant="outline" className="mt-2">
                    {formatDomain(coach.coachPrimaryDomain)}
                  </Badge>
                )}
                
                {coach.averageRating !== null && (
                  <div className="mt-3">
                    <RatingDisplay 
                      rating={coach.averageRating} 
                      reviewCount={coach.totalSessions}
                      size="md"
                    />
                  </div>
                )}
                
                <div className="mt-6 w-full">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setIsBookingModalOpen(true)}
                  >
                    Book a Session
                  </Button>
                  
                  <Button 
                    className="w-full mt-3" 
                    variant="outline"
                    size="lg"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col items-center">
                    <DollarSign className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="font-semibold">
                      ${coach.hourlyRate || 0}/hr
                    </span>
                    <span className="text-xs text-muted-foreground">Rate</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Users className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="font-semibold">
                      {coach.totalSessions}+
                    </span>
                    <span className="text-xs text-muted-foreground">Sessions</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Tabs Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="about">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="expertise">Expertise</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About {coach.firstName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {coach.bio ? (
                      <p>{coach.bio}</p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        This coach hasn't added a bio yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Coaching Style</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <Award className="h-5 w-5 mr-2 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Personalized Approach</h3>
                        <p className="text-sm text-muted-foreground">
                          Tailored coaching to meet your specific needs and goals
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 mr-2 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Flexible Scheduling</h3>
                        <p className="text-sm text-muted-foreground">
                          Book sessions that fit your busy schedule
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Focused Sessions</h3>
                        <p className="text-sm text-muted-foreground">
                          Efficient use of time to maximize results
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Star className="h-5 w-5 mr-2 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Results-Oriented</h3>
                        <p className="text-sm text-muted-foreground">
                          Focused on helping you achieve measurable outcomes
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="expertise" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Areas of Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="text-sm py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      This coach hasn't added any skills yet.
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Real Estate Domains</CardTitle>
                </CardHeader>
                <CardContent>
                  {domains.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {domains.map(domain => (
                        <Badge key={domain} variant="outline" className="text-sm py-1">
                          {formatDomain(domain)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      This coach hasn't added any domains yet.
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Session Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Session Rate</span>
                      <span>${coach.hourlyRate || 0}/hour</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Session Length</span>
                      <span>{coach.sessionConfig?.defaultDuration || 60} minutes</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Availability</span>
                      <span>Varies (see booking calendar)</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="pt-2">
                      <Button 
                        className="w-full" 
                        onClick={() => setIsBookingModalOpen(true)}
                      >
                        Check Availability & Book
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {coach.totalSessions > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 rounded-full p-3">
                          <Star className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center">
                            <span className="text-2xl font-bold mr-2">
                              {coach.averageRating?.toFixed(1) || '0.0'}
                            </span>
                            <RatingDisplay 
                              rating={coach.averageRating || 0} 
                              showCount={false}
                              size="sm"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Based on {coach.totalSessions} sessions
                          </p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <p className="text-center text-muted-foreground py-8">
                        Detailed reviews coming soon!
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No reviews yet. Be the first to work with {coach.firstName}!
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        coachName={fullName}
        sessionConfig={{
          durations: [coach.sessionConfig?.defaultDuration || 60],
          rates: { [coach.sessionConfig?.defaultDuration || 60]: coach.hourlyRate ?? 0 },
          currency: 'USD',
          defaultDuration: coach.sessionConfig?.defaultDuration || 60,
          allowCustomDuration: coach.sessionConfig?.allowCustomDuration || false,
          minimumDuration: coach.sessionConfig?.minimumDuration || 30,
          maximumDuration: coach.sessionConfig?.maximumDuration || 90,
          isActive: true
        }}
      />
    </div>
  )
}

// Helper function to format domain names for display
function formatDomain(domain: RealEstateDomain): string {
  return domain
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
} 