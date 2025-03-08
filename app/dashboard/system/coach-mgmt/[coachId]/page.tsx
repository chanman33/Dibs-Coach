import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { CoachProfileStatusManager } from '@/components/admin/CoachProfileStatusManager'
import { fetchCoachProfile, updateCoachProfileStatus } from '@/utils/actions/admin-coach-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Calendar, Clock, DollarSign, Award, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { PROFILE_STATUS, ProfileStatus } from '@/utils/types/coach'
import { formatDistanceToNow } from 'date-fns'

const REAL_ESTATE_DOMAINS = [
  'REALTOR',
  'INVESTOR',
  'MORTGAGE',
  'PROPERTY_MANAGER',
  'TITLE_ESCROW',
  'INSURANCE',
  'COMMERCIAL',
  'PRIVATE_CREDIT'
] as const;

type RealEstateDomain = typeof REAL_ESTATE_DOMAINS[number];

interface CoachProfilePageProps {
  params: {
    coachId: string
  }
}

export default async function CoachProfilePage({ params }: CoachProfilePageProps) {
  // Fetch coach profile data
  const { data: profile, error } = await fetchCoachProfile(params.coachId)

  // Handle not found or errors
  if (error || !profile) {
    notFound()
  }

  // Server action to update profile status
  async function updateProfileStatus(coachId: string, newStatus: typeof PROFILE_STATUS[keyof typeof PROFILE_STATUS]) {
    'use server'
    
    const { data } = await updateCoachProfileStatus({
      coachUlid: coachId,
      status: newStatus
    })
    
    return !!data?.success
  }

  const getInitials = (firstName: string, lastName: string) => {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case PROFILE_STATUS.PUBLISHED:
        return <Badge className="bg-green-500 hover:bg-green-600">Published</Badge>
      case PROFILE_STATUS.DRAFT:
        return <Badge variant="secondary">Draft</Badge>
      case PROFILE_STATUS.ARCHIVED:
        return <Badge variant="destructive">Archived</Badge>
      default:
        return null
    }
  }

  const getProfileCompletionStatus = (percentage: number) => {
    if (percentage >= 100) {
      return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: 'Complete' };
    } else if (percentage >= 70) {
      return { icon: <CheckCircle className="h-5 w-5 text-amber-500" />, text: 'Almost Complete' };
    } else {
      return { icon: <AlertTriangle className="h-5 w-5 text-red-500" />, text: 'Incomplete' };
    }
  }

  const completionStatus = getProfileCompletionStatus(profile.completionPercentage);

  const validDomains = (profile.realEstateDomains || []).filter((domain): domain is RealEstateDomain => 
    REAL_ESTATE_DOMAINS.includes(domain as RealEstateDomain)
  );

  return (
    <div className="container space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/system/coach-mgmt">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Coach Profile</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/coach/${profile.userUlid}`}>
              View Public Profile
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage coach profile details and status
        </p>
      </div>
        
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.profileImageUrl || undefined} alt={`${profile.firstName} ${profile.lastName}`} />
                <AvatarFallback className="text-lg">{getInitials(profile.firstName, profile.lastName)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-2xl">{profile.firstName} {profile.lastName}</CardTitle>
                  {renderStatusBadge(profile.profileStatus)}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4 mr-1" />
                  <CardDescription className="text-sm">{profile.email}</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="rounded-sm">Coach</Badge>
                  {profile.completionPercentage === 100 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 rounded-sm">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-1">
                    {completionStatus.icon}
                    Profile Completion ({completionStatus.text})
                  </h3>
                  <span className="text-sm font-bold">{profile.completionPercentage}%</span>
                </div>
                <Progress value={profile.completionPercentage} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Award className="h-4 w-4 text-blue-500" />
                    Real Estate Domains
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.realEstateDomains.length > 0 ? (
                      profile.realEstateDomains.map((domain) => (
                        <Badge key={domain} variant="secondary">{domain}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No domains specified</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Coaching Rate
                  </h3>
                  <p className="text-xl font-semibold">
                    {profile.hourlyRate 
                      ? `$${profile.hourlyRate}/hr`
                      : <span className="text-muted-foreground text-base">Not set</span>}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Profile Created
                  </h3>
                  <p className="text-sm">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Last Updated
                  </h3>
                  <p className="text-sm">
                    {new Date(profile.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(profile.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Status Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Status</CardTitle>
            <CardDescription>Manage visibility and domains</CardDescription>
          </CardHeader>
          <CardContent>
            <CoachProfileStatusManager
              coachId={profile.userUlid}
              coachName={`${profile.firstName} ${profile.lastName}`}
              currentStatus={profile.profileStatus}
              completionPercentage={profile.completionPercentage}
              approvedSpecialties={validDomains}
              updateStatus={updateProfileStatus}
              updateSpecialties={async () => true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 