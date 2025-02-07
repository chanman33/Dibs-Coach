'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import CoachApplicationForm from '@/app/apply-coach/_components/CoachApplicationForm'
import { getCoachApplication } from '@/utils/actions/coach-application'
import { useRouter } from 'next/navigation'

interface RealtorProfileFormData {
  companyName: string
  licenseNumber: string
  phoneNumber: string
  brokerId?: string | null
  teamId?: string | null
}

interface CoachProfileFormData {
  specialty: string
  bio: string
  experience: string
  specialties: string
  skills: string  // maps to certifications
}

interface RealtorCoachProfile {
  id: number
  specialty: string | null
  bio: string | null
  experience: string | null
  specialties: string[] | null
  certifications: string[] | null
}

interface CoachApplication {
  id: number
  applicantDbId: number
  status: string
  experience: string
  specialties: string[]
  applicationDate: string
  reviewerDbId: number | null
  reviewDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  applicant: {
    id: number
    email: string
    firstName: string
    lastName: string
  } | null
  reviewer: {
    id: number
    email: string
    firstName: string
    lastName: string
  } | null
}

interface ProfileDashboardProps {
  userId: string
  userRole: string
}

export function ProfileDashboard({ userId, userRole }: ProfileDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coachLoading, setCoachLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [coachApplication, setCoachApplication] = useState<CoachApplication | null>(null)
  
  const isCoach = userRole === 'realtor_coach' || userRole === 'loan_officer_coach'
  const isAdmin = userRole === 'admin'
  const canApplyForCoach = !isCoach && !isAdmin && userRole === 'realtor'

  const { 
    register, 
    handleSubmit, 
    setValue,
    formState: { errors }
  } = useForm<RealtorProfileFormData>({
    defaultValues: {
      companyName: '',
      licenseNumber: '',
      phoneNumber: ''
    }
  })

  const {
    register: registerCoach,
    handleSubmit: handleCoachSubmit,
    setValue: setCoachValue,
    formState: { errors: coachErrors }
  } = useForm<CoachProfileFormData>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const profileResponse = await fetch('/api/user/realtor')
        const profileData = await profileResponse.json()
        
        // Populate the realtor form with profile data
        setValue('companyName', profileData.companyName || '')
        setValue('licenseNumber', profileData.licenseNumber || '')
        setValue('phoneNumber', profileData.phoneNumber || '')
        
        // If user is a coach, fetch their coach profile
        if (userRole === 'realtor_coach' || userRole === 'loan_officer_coach') {
          try {
            setCoachLoading(true)
            const coachResponse = await fetch('/api/user/coach/profile')
            if (!coachResponse.ok) {
              const errorData = await coachResponse.json()
              throw new Error(errorData.error || 'Failed to load coach profile')
            }
            const coachData = await coachResponse.json()
            
            // Populate the coach form
            setCoachValue('specialty', coachData.specialty || '')
            setCoachValue('bio', coachData.bio || '')
            setCoachValue('experience', coachData.experience || '')
            setCoachValue('specialties', Array.isArray(coachData.specialties) 
              ? coachData.specialties.join(', ')
              : '')
            setCoachValue('skills', Array.isArray(coachData.certifications)
              ? coachData.certifications.join(', ')
              : '')
          } catch (error) {
            console.error('[COACH_PROFILE_FETCH_ERROR]', error)
            toast.error(error instanceof Error ? error.message : 'Failed to load coach profile')
          } finally {
            setCoachLoading(false)
          }
        }
        
        try {
          const applicationData = await getCoachApplication()
          
          // For admin users, we don't want to show any application in their profile
          if (userRole === 'admin') {
            setCoachApplication(null)
          } else {
            // For non-admin users, find their application
            const userApplication = applicationData?.find(
              (app: CoachApplication) => app.applicantDbId === profileData.id
            )
            
            if (userApplication) {
              setCoachApplication(userApplication)
            }
          }
        } catch (error) {
          console.error('[COACH_APPLICATION_ERROR]', error)
        }
      } catch (error) {
        console.error('[PROFILE_FETCH_ERROR]', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [userId, userRole])

  const onSubmit = async (data: RealtorProfileFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/realtor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.companyName || null,
          licenseNumber: data.licenseNumber || null,
          phoneNumber: data.phoneNumber || null,
          brokerId: data.brokerId || null,
          teamId: data.teamId || null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to update profile')
      }
      
      const responseData = await response.json()
      toast.success(responseData.message || 'Profile updated successfully')
    } catch (error) {
      console.error('[PROFILE_UPDATE_ERROR]', error)
      toast.error(error instanceof Error 
        ? `Error updating profile: ${error.message}` 
        : 'An unexpected error occurred'
      )
    } finally {
      setLoading(false)
    }
  }

  const onCoachSubmit = async (data: CoachProfileFormData) => {
    setCoachLoading(true)
    try {
      // Convert comma-separated strings to arrays
      const specialties = data.specialties.split(',').map(s => s.trim()).filter(Boolean)
      const skills = data.skills.split(',').map(s => s.trim()).filter(Boolean)
      
      const response = await fetch('/api/user/coach/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialty: data.specialty || null,
          bio: data.bio || null,
          experience: data.experience || null,
          specialties,
          certifications: skills
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to update coach profile')
      }
      
      const responseData = await response.json()
      toast.success(responseData.message || 'Coach profile updated successfully')
    } catch (error) {
      console.error('[COACH_PROFILE_UPDATE_ERROR]', error)
      toast.error(error instanceof Error 
        ? `Error updating coach profile: ${error.message}` 
        : 'An unexpected error occurred'
      )
    } finally {
      setCoachLoading(false)
    }
  }

  const handleApplyForCoach = () => {
    router.push('/apply-coach')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
      </div>

      <div className="grid gap-4">
        {/* Realtor Profile Form */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Realtor Profile</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  placeholder="Enter your company name"
                  {...register('companyName')}
                  className={errors.companyName ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input 
                  id="licenseNumber" 
                  placeholder="Enter your license number"
                  {...register('licenseNumber')}
                  className={errors.licenseNumber ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input 
                  id="phoneNumber" 
                  placeholder="Enter your phone number"
                  {...register('phoneNumber')}
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Coach Profile Form - Only shown for active coaches */}
        {isCoach && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold">Coach Profile</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCoachSubmit(onCoachSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Primary Specialty</Label>
                  <Input 
                    id="specialty" 
                    placeholder="Enter your primary coaching specialty"
                    {...registerCoach('specialty')}
                    className={coachErrors.specialty ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Share your background and coaching philosophy"
                    {...registerCoach('bio')}
                    className={coachErrors.bio ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Textarea 
                    id="experience" 
                    placeholder="Describe your real estate and coaching experience"
                    {...registerCoach('experience')}
                    className={coachErrors.experience ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialties">Specialties</Label>
                  <Textarea 
                    id="specialties" 
                    placeholder="List your coaching specialties (comma-separated)"
                    {...registerCoach('specialties')}
                    className={coachErrors.specialties ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Certifications & Skills</Label>
                  <Input 
                    id="skills" 
                    placeholder="Enter your certifications (comma-separated)"
                    {...registerCoach('skills')}
                    className={coachErrors.skills ? 'border-red-500' : ''}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={coachLoading}>
                  {coachLoading ? 'Saving...' : 'Save Coach Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Coach Application Section - Only show for realtors who can apply */}
        {canApplyForCoach && !coachApplication && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold">Become a Coach</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Share your expertise and help other realtors succeed. Apply to become a coach today.
              </p>
              <Button 
                onClick={handleApplyForCoach}
                className="w-full"
              >
                Apply to Become a Coach
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Show application status if user has applied */}
        {coachApplication && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold">Coach Application Status</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Application Status</Label>
                  <p className="mt-1 text-muted-foreground capitalize font-medium">
                    {coachApplication.status.toLowerCase()}
                  </p>
                </div>
                <div>
                  <Label>Experience</Label>
                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                    {coachApplication.experience}
                  </p>
                </div>
                <div>
                  <Label>Specialties</Label>
                  <p className="mt-1 text-muted-foreground">
                    {Array.isArray(coachApplication.specialties) 
                      ? coachApplication.specialties.join(', ')
                      : 'No specialties listed'}
                  </p>
                </div>
                <div>
                  <Label>Application Date</Label>
                  <p className="mt-1 text-muted-foreground">
                    {new Date(coachApplication.applicationDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {coachApplication.notes && (
                  <div>
                    <Label>Admin Notes</Label>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                      {coachApplication.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 