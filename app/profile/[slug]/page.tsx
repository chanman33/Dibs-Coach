// import { useEffect, useState } from 'react'
// import { createClient } from '@/utils/supabase/client'
// import { useParams } from 'next/navigation'
import { notFound, useRouter } from 'next/navigation'
import { Loader2, Calendar, Clock, DollarSign, Star, Award, Users, Mail, ArrowLeft, Globe, Facebook, Instagram, Linkedin, Youtube, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RatingDisplay } from '@/components/coaching/shared/RatingDisplay'
// import { SimilarCoaches } from '@/components/coaching/public/SimilarCoaches'
import { PublicCoach, RealEstateDomain } from '@/utils/types/coach'
import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { USER_CAPABILITIES } from '@/utils/roles/roles'
import { fetchUserCapabilities } from '@/utils/actions/user-profile-actions'
import { fetchPublicCoachProfileBySlug, PublicCoachProfile } from '@/utils/actions/public-coach-profile-actions'
import { SimilarCoaches } from '@/components/coaching/coach-profiles/SimilarCoaches'
import { fetchCoachPortfolioItems } from '@/utils/actions/portfolio-actions'
import { PublicPortfolioGrid } from '@/components/coach-profile/PublicPortfolioGrid'
import { PublicRecognitionsGrid } from '@/components/coach-profile/PublicRecognitionsGrid'
import { SocialLinks } from '@/components/coach-profile/SocialLinks'
// import { ProfessionalRecognitionCard } from '@/components/coaching/shared/recognitions/ProfessionalRecognitionCard'
// import { SocialLinks } from '@/components/shared/SocialLinks'
import type { PortfolioItem } from '@/utils/types/portfolio'

interface CoachProfilePageProps {
  params: {
    slug: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CoachProfilePage({ params, searchParams }: CoachProfilePageProps) {
  const slug = params.slug;
  // const router = useRouter(); // Can't use useRouter in Server Components
  
  // Fetch data server-side
  const coachResult = await fetchPublicCoachProfileBySlug({ slug });
  const coach = coachResult.data as PublicCoachProfile;
  const error = coachResult.error;
  
  // Fetch logged-in user data
  const user = await currentUser();
  const userCapabilitiesResult = user ? await fetchUserCapabilities({ skipProfileCheck: true }) : { data: { capabilities: [] } };
  const loggedInUserCapabilities = userCapabilitiesResult.data?.capabilities || [];
  
  // Fetch portfolio items for the coach (public, visible only)
  let portfolioItems: PortfolioItem[] = [];
  if (coach && coach.userUlid) {
    const portfolioResult = await fetchCoachPortfolioItems(coach.userUlid);
    if (portfolioResult.data) {
      // Ensure all dates are strings and all required fields are present
      portfolioItems = portfolioResult.data.map((item: any) => ({
        ...item,
        date: (typeof item.date === 'string') ? item.date : (item.date instanceof Date ? item.date.toISOString() : String(item.date)),
        createdAt: (typeof item.createdAt === 'string') ? item.createdAt : (item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt)),
        updatedAt: (typeof item.updatedAt === 'string') ? item.updatedAt : (item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt)),
        // Defensive: ensure isVisible is boolean
        isVisible: typeof item.isVisible === 'boolean' ? item.isVisible : true,
        // Defensive: ensure tags is array
        tags: Array.isArray(item.tags) ? item.tags : [],
        // Defensive: ensure imageUrls is array
        imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : [],
      }));
    } else {
      // Optionally log or handle error
      console.error('[PROFILE_PAGE_PORTFOLIO_ERROR]', portfolioResult.error);
    }
  }
  
  // Handle coach not found or error
  if (error && error.code === 'NOT_FOUND') {
    notFound(); // Trigger 404 page
  }
  
  if (error && error.code !== 'NOT_FOUND') {
    // Generic error display - could be more sophisticated
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error.message || 'Failed to load coach profile. Please try again later.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/coaches">
              <Button>Back to Coaches</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Explicit check to satisfy TypeScript after error handling
  if (!coach) {
    // This should technically be unreachable if the above error handling is correct
    // but it satisfies the type checker.
    console.error("[PROFILE_PAGE_ERROR] Coach data is null after error checks. Slug:", slug);
    notFound(); 
  }
  
  // Determine user context for display logic
  const isAuthenticated = !!user;
  const isMentee = loggedInUserCapabilities.includes(USER_CAPABILITIES.MENTEE);
  const isCoach = loggedInUserCapabilities.includes(USER_CAPABILITIES.COACH);
  const isOwnProfile = isAuthenticated && user?.publicMetadata?.userUlid === coach.userUlid;
  
  // Determine what content to show based on authentication status
  const shouldShowFullProfile = isAuthenticated; // Example: Show more details if logged in
  const shouldShowContactInfo = isAuthenticated && (isMentee || isCoach); // Example: Show contact if mentee/coach
  const shouldShowBookingButton = isAuthenticated && !isOwnProfile; // Example: Show booking if logged in & not own profile
  
  // Determine back link (configurable by user capabilities)
  let defaultBackLink = '/coaches';
  if (isAuthenticated) {
    if (isCoach) defaultBackLink = '/dashboard/coach/browse-coaches';
    else if (isMentee) defaultBackLink = '/dashboard/mentee/browse-coaches';
  }
  const referrer = searchParams?.from && typeof searchParams.from === 'string' && searchParams.from.startsWith('/')
    ? searchParams.from
    : defaultBackLink;
    
  // Prepare data for rendering
  const fullName = `${coach.firstName} ${coach.lastName}`.trim();
  const displayName = coach.displayName || fullName;
  const skills = coach.coachSkills || [];
  const domains = coach.coachRealEstateDomains || [];
  const recognitions = coach.recognitions || [];
  
  // Social links data
  const socialLinks = {
    website: coach.websiteUrl ?? undefined,
    facebook: coach.facebookUrl ?? undefined,
    instagram: coach.instagramUrl ?? undefined,
    linkedin: coach.linkedinUrl ?? undefined,
    youtube: coach.youtubeUrl ?? undefined,
    tiktok: coach.tiktokUrl ?? undefined,
    xUrl: coach.xUrl ?? undefined,
  };

  // Authentication prompt component (can remain a simple functional component)
  const AuthPrompt = () => (
    !isAuthenticated ? (
      <Card className="bg-muted/30 border-dashed mt-6">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to see full coach details and book a session
          </p>
          <Link href={`/sign-in?return_url=${encodeURIComponent(`/profile/${slug}`)}`}>
            <Button size="sm">Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    ) : null
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Back Button */}
      <div className="mb-6 mt-0">
        <Link href={referrer}>
          <Button variant="ghost" className="flex items-center gap-2 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="h-4 w-4" />
            Back
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
                      priority // Add priority for LCP optimization
                      sizes="(max-width: 1024px) 128px, 128px" // Example sizes attribute
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
                  <p className="text-muted-foreground mt-1 text-sm">
                    {coach.slogan}
                  </p>
                )}
                
                {coach.coachPrimaryDomain && (
                  <Badge variant="secondary" className="mt-3">
                    Primary: {formatDomain(coach.coachPrimaryDomain)}
                  </Badge>
                )}
                
                {coach.averageRating !== null && coach.totalSessions > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <RatingDisplay rating={coach.averageRating} />
                    <span className="text-sm text-muted-foreground">({coach.totalSessions} sessions)</span>
                  </div>
                )}
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4 text-sm">
                {coach.hourlyRate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" /> Hourly Rate</span>
                    <span className="font-medium">${coach.hourlyRate}</span>
                  </div>
                )}
                {coach.yearsCoaching !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2"><Award className="h-4 w-4" /> Years Coaching</span>
                    <span className="font-medium">{coach.yearsCoaching}+</span>
                  </div>
                )}
              </div>
              
              {/* Booking Button / Sign In Prompt */}
              <div className="mt-6">
                {shouldShowBookingButton ? (
                  <Link href={`/booking/${coach.profileSlug || coach.ulid}`} className="w-full">
                    <Button className="w-full">
                      <Calendar className="mr-2 h-4 w-4" /> Book a Session
                    </Button>
                  </Link>
                ) : isOwnProfile ? (
                  <Link href="/dashboard/coach/profile" className="w-full">
                    <Button variant="outline" className="w-full">
                      Edit Your Profile
                    </Button>
                  </Link>
                ) : !isAuthenticated ? (
                  <AuthPrompt />
                ) : null}
              </div>
            </CardContent>
          </Card>
          {/* Social Links Card - now a unique card below the profile card and booking button */}
          <SocialLinks links={socialLinks} className="mt-6" />
        </div>
        
        {/* Right Column - Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="recognitions">Recognitions</TabsTrigger>
            </TabsList>
            
            {/* About Tab */}
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About {coach.firstName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {coach.bio ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">{coach.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No biography provided.</p>
                  )}
                  
                  {domains.length > 0 && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4" /> Industry Focus Areas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {domains.map(domain => (
                          <Badge key={domain} variant="secondary" className="px-3 py-1 text-sm">
                            {formatDomain(domain)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Skills Card (moved from tab to underneath About) */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Coaching Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">{skill}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No coaching skills listed.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Portfolio Tab */}
            <TabsContent value="portfolio">
              <PublicPortfolioGrid portfolioItems={portfolioItems} />
            </TabsContent>

            {/* Recognitions Tab */}
            <TabsContent value="recognitions">
              <PublicRecognitionsGrid recognitions={coach.recognitions || []} />
            </TabsContent>
          </Tabs>
          
          {/* Authentication Prompt (if not already shown in button area) */}
          {!isAuthenticated && !shouldShowBookingButton && (
             <div className="mt-8">
               <AuthPrompt />
             </div>
           )}
           
          {/* TODO: Consider re-adding Similar Coaches section if needed */}
          <div className="mt-12">
            <SimilarCoaches currentCoachId={coach.ulid} skills={skills} domains={domains} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function (can stay client-side if needed elsewhere, or moved/duplicated)
function formatDomain(domain: RealEstateDomain): string {
  if (!domain) return ''
  return domain
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
} 