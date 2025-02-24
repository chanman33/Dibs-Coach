import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CoachProfileStatusManager } from '@/components/admin/CoachProfileStatusManager'
import { fetchCoachProfile, updateCoachProfileStatus } from '@/utils/actions/admin-coach-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PROFILE_STATUS } from '@/utils/types/coach'

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
        return <Badge className="bg-green-500">Published</Badge>
      case PROFILE_STATUS.REVIEW:
        return <Badge className="bg-yellow-500">In Review</Badge>
      case PROFILE_STATUS.DRAFT:
        return <Badge className="bg-gray-500">Draft</Badge>
      default:
        return null
    }
  }

  return (
    <div className="container max-w-screen-lg py-6">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/system/coach-mgmt">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Coach Management
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.profileImageUrl || undefined} alt={`${profile.firstName} ${profile.lastName}`} />
                  <AvatarFallback>{getInitials(profile.firstName, profile.lastName)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{profile.firstName} {profile.lastName}</CardTitle>
                    {renderStatusBadge(profile.profileStatus)}
                  </div>
                  <CardDescription>{profile.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Profile Completion</h3>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Completion</span>
                    <span>{profile.completionPercentage}%</span>
                  </div>
                  <Progress value={profile.completionPercentage} className="h-2" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.length > 0 ? (
                      profile.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary">{specialty}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No specialties specified</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Coaching Rate</h3>
                  <p className="text-xl font-semibold">
                    {profile.hourlyRate 
                      ? `$${profile.hourlyRate}/hr`
                      : <span className="text-muted-foreground">Not set</span>}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Profile Created</h3>
                    <p className="text-sm">
                      {new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Last Updated</h3>
                    <p className="text-sm">
                      {new Date(profile.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Status Management Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
              <CardDescription>Update the coach profile status</CardDescription>
            </CardHeader>
            <CardContent>
              <CoachProfileStatusManager
                coachId={profile.userUlid}
                coachName={`${profile.firstName} ${profile.lastName}`}
                currentStatus={profile.profileStatus}
                completionPercentage={profile.completionPercentage}
                updateStatus={updateProfileStatus}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 