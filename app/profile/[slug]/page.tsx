'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { notFound, useParams, useRouter } from 'next/navigation'
import { Loader2, Calendar, Clock, DollarSign, Star, Award, Users, Mail, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RatingDisplay } from '@/components/coaching/shared/RatingDisplay'
import { SimilarCoaches } from '@/components/coaching/public/SimilarCoaches'
import { PublicCoach, RealEstateDomain } from '@/utils/types/coach'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { USER_CAPABILITIES } from '@/utils/roles/roles'

export default function CoachProfilePage() {
  // Use the useParams hook to get the slug parameter
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  
  const [coach, setCoach] = useState<PublicCoach | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [referrer, setReferrer] = useState<string>('/coaches')
  const supabase = createClient()
  const { user, isLoaded } = useUser()

  // Determine the correct back link based on user role
  useEffect(() => {
    try {
      // First check if we have a referrer in the URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const fromParam = urlParams.get('from');
      
      // Log the navigation context for debugging
      console.log('[PROFILE_NAVIGATION_CONTEXT]', {
        fromParam,
        userLoaded: isLoaded,
        hasUser: !!user,
        userRole: user?.publicMetadata?.role,
        userCapabilities: user?.publicMetadata?.capabilities,
        pathname: window.location.pathname,
        timestamp: new Date().toISOString()
      });
      
      // If we have a valid 'from' parameter, use it as the referrer
      if (fromParam && fromParam.startsWith('/')) {
        setReferrer(fromParam);
        return;
      }
      
      // If no 'from' parameter, determine based on user role and capabilities
      if (isLoaded && user) {
        // Get user role and capabilities from metadata
        const userRole = user.publicMetadata?.role as string;
        const userCapabilities = user.publicMetadata?.capabilities as string[] || [];
        
        // Determine the appropriate route based on capabilities
        if (userCapabilities.includes(USER_CAPABILITIES.COACH)) {
          setReferrer('/dashboard/coach/browse-coaches');
        } else if (userCapabilities.includes(USER_CAPABILITIES.MENTEE)) {
          setReferrer('/dashboard/mentee/browse-coaches');
        } else {
          // Fallback to public route if no specific capability
          setReferrer('/coaches');
        }
      } else {
        // Default to public route for unauthenticated users
        setReferrer('/coaches');
      }
    } catch (error) {
      console.error('[PROFILE_NAVIGATION_ERROR]', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      // Default to public route if there's an error
      setReferrer('/coaches');
    }
  }, [isLoaded, user]);

  // Update document title when coach data is loaded
  useEffect(() => {
    if (coach) {
      document.title = `${coach.firstName} ${coach.lastName} | Coach Profile`;
    }
  }, [coach]);

  useEffect(() => {
    async function fetchCoachProfile() {
      setIsLoading(true)
      setError(null)
      
      try {
        // Check if the slug is a ULID or a custom slug
        const isUlid = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i.test(slug);
        
        console.log('[COACH_PROFILE_FETCH]', { 
          slug, 
          isUlid, 
          lookupField: isUlid ? 'ulid' : 'profileSlug',
          timestamp: new Date().toISOString()
        });
        
        // Log the query we're about to execute
        console.log('[COACH_PROFILE_QUERY]', {
          table: 'CoachProfile',
          field: isUlid ? 'ulid' : 'profileSlug',
          value: slug
        });
        
        // First get the coach profile data
        const { data: profileData, error: profileError } = await supabase
          .from('CoachProfile')
          .select(`
            ulid,
            userUlid,
            yearsCoaching,
            coachSkills,
            hourlyRate,
            minimumDuration,
            defaultDuration,
            maximumDuration,
            allowCustomDuration,
            isActive,
            coachPrimaryDomain,
            coachRealEstateDomains,
            slogan,
            profileSlug,
            averageRating,
            totalSessions
          `)
          .eq(isUlid ? 'ulid' : 'profileSlug', slug)
          .single()
          
        // Log the response data
        console.log('[COACH_PROFILE_RESPONSE]', {
          success: !profileError,
          error: profileError ? profileError.message : null,
          dataExists: !!profileData,
          dataFields: profileData ? Object.keys(profileData) : null
        });
        
        if (profileError) {
          console.error('[COACH_PROFILE_ERROR]', profileError)
          setError('Failed to load coach information')
          return
        }
        
        if (!profileData) {
          notFound()
          return
        }

        // Type assertion to help TypeScript understand the structure
        const typedProfileData = profileData as unknown as {
          ulid: string;
          userUlid: string;
          yearsCoaching: number;
          coachSkills: string[];
          hourlyRate: number | null;
          minimumDuration: number;
          defaultDuration: number;
          maximumDuration: number;
          allowCustomDuration: boolean;
          isActive: boolean;
          coachPrimaryDomain: RealEstateDomain | null;
          coachRealEstateDomains: RealEstateDomain[];
          slogan: string | null;
          profileSlug: string | null;
          averageRating: number | null;
          totalSessions: number;
        };

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
          .eq('ulid', typedProfileData.userUlid)
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
          ulid: typedProfileData.ulid,
          userUlid: userData.ulid,
          firstName: userData.firstName,
          lastName: userData.lastName,
          displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`.trim(),
          bio: userData.bio,
          profileImageUrl: userData.profileImageUrl,
          slogan: typedProfileData.slogan,
          coachSkills: typedProfileData.coachSkills || [],
          coachRealEstateDomains: typedProfileData.coachRealEstateDomains || [],
          coachPrimaryDomain: typedProfileData.coachPrimaryDomain,
          hourlyRate: typedProfileData.hourlyRate,
          averageRating: typedProfileData.averageRating,
          totalSessions: typedProfileData.totalSessions || 0,
          profileSlug: typedProfileData.profileSlug,
          sessionConfig: {
            defaultDuration: typedProfileData.defaultDuration,
            minimumDuration: typedProfileData.minimumDuration,
            maximumDuration: typedProfileData.maximumDuration,
            allowCustomDuration: typedProfileData.allowCustomDuration
          }
        }
        
        setCoach(coachData)
      } catch (err) {
        console.error('[COACH_PROFILE_ERROR]', err)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCoachProfile()
  }, [slug])

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Back to Browsing Coaches Button */}
      <div className="mb-6 mt-0">
        <Link href={referrer}>
          <Button variant="ghost" className="flex items-center gap-2 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="h-4 w-4" />
            Back to Browsing Coaches
          </Button>
        </Link>
      </div>
      
      {/* Coach Profile Content */}
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
                
                {coach.averageRating !== null ? (
                  <div className="mt-3">
                    <RatingDisplay 
                      rating={coach.averageRating} 
                      reviewCount={coach.totalSessions}
                      size="md"
                    />
                  </div>
                ) : (
                  <div className="mt-3">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                      New Coach
                    </span>
                  </div>
                )}
                
                <div className="mt-6 w-full">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => {
                      const queryParam = coach.profileSlug 
                        ? `slug=${coach.profileSlug}` 
                        : `coachId=${coach.userUlid}`
                      router.push(`/booking/availability?${queryParam}`)
                    }}
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
                        onClick={() => {
                          const queryParam = coach.profileSlug 
                            ? `slug=${coach.profileSlug}` 
                            : `coachId=${coach.userUlid}`
                          router.push(`/booking/availability?${queryParam}`)
                        }}
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
                    <div className="text-center py-8">
                      <div className="flex justify-center mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          New Coach
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        No reviews yet. Be the first to work with {coach.firstName}!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Similar Coaches Section */}
      <div className="mt-12">
        <SimilarCoaches 
          currentCoachId={coach.ulid} 
          skills={coach.coachSkills} 
          domains={coach.coachRealEstateDomains} 
        />
      </div>
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