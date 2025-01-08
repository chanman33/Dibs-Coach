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
import CoachApplicationForm from '@/components/CoachApplicationForm'
import { getCoachApplication } from '@/utils/actions/coach-application'
import { fetchCoaches } from '@/app/api/user/coach/route'
import { useAuth } from '@clerk/nextjs'
import { fetchCoachByClerkId } from '@/app/api/user/coach/route'

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

interface CoachData {
  id: number
  userId: string
  firstName: string | null
  lastName: string | null
  RealtorCoachProfile: RealtorCoachProfile
}

interface CoachApplication {
  id: number;
  applicantDbId: number;
  status: string;
  experience: string;
  specialties: string[];
  applicationDate: string;
  reviewerDbId: number | null;
  reviewDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  applicant: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  reviewer: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export default function RealtorProfilePage() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [coachLoading, setCoachLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [coachApplication, setCoachApplication] = useState<CoachApplication | null>(null)
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
        console.log('[DEBUG] Setting realtor form values:', {
          companyName: profileData.companyName,
          licenseNumber: profileData.licenseNumber,
          phoneNumber: profileData.phoneNumber
        });
        
        setValue('companyName', profileData.companyName || '');
        setValue('licenseNumber', profileData.licenseNumber || '');
        setValue('phoneNumber', profileData.phoneNumber || '');
        
        // If user is a coach, fetch their coach profile
        if (profileData.role === 'realtor_coach') {
          try {
            setCoachLoading(true);
            const coachResponse = await fetch('/api/user/coach/profile');
            if (!coachResponse.ok) {
              const errorData = await coachResponse.json();
              throw new Error(errorData.error || 'Failed to load coach profile');
            }
            const coachData = await coachResponse.json();
            
            console.log('[DEBUG] Setting coach form values:', coachData);
            
            // Populate the coach form
            setCoachValue('specialty', coachData.specialty || '');
            setCoachValue('bio', coachData.bio || '');
            setCoachValue('experience', coachData.experience || '');
            setCoachValue('specialties', Array.isArray(coachData.specialties) 
              ? coachData.specialties.join(', ')
              : '');
            setCoachValue('skills', Array.isArray(coachData.certifications)
              ? coachData.certifications.join(', ')
              : '');
          } catch (error) {
            console.error('[COACH_PROFILE_FETCH_ERROR]', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load coach profile');
          } finally {
            setCoachLoading(false);
          }
        }
        
        try {
          const applicationData = await getCoachApplication();
          console.log('[DEBUG] All applications:', applicationData);
          console.log('[DEBUG] Current user:', { 
            clerkId: userId,
            dbId: profileData.id,
            role: profileData.role
          });
          
          // For admin users, we don't want to show any application in their profile
          if (profileData.role === 'admin') {
            console.log('[DEBUG] Admin user, setting application to null');
            setCoachApplication(null);
          } else {
            // For non-admin users, find their application
            console.log('[DEBUG] Looking for application with applicantDbId:', profileData.id);
            const userApplication = applicationData?.find(
              (app: CoachApplication) => {
                console.log('[DEBUG] Comparing application:', {
                  applicationId: app.applicantDbId,
                  userId: profileData.id,
                  matches: app.applicantDbId === profileData.id
                });
                return app.applicantDbId === profileData.id;
              }
            );
            
            console.log('[DEBUG] Application lookup result:', {
              profileId: profileData.id,
              foundApplication: !!userApplication,
              applicationDetails: userApplication
            });
            
            if (userApplication) {
              console.log('[DEBUG] Setting coach application state:', {
                ...userApplication,
                specialties: userApplication.specialties
              });
              setCoachApplication(userApplication);
            }
          }
        } catch (error) {
          console.error('[COACH_APPLICATION_ERROR]', error);
        }

        setUserRole(profileData.role || 'realtor')
      } catch (error) {
        console.error('[PROFILE_FETCH_ERROR]', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [userId])

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
      console.log('[DEBUG] Submitting coach profile update:', data)
      
      // Convert comma-separated skills string to array, with type safety
      const skills: string[] = data.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
      
      const response = await fetch('/api/user/coach/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialty: data.specialty || '',
          bio: data.bio || '',
          experience: data.experience || '',
          specialties: data.specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
          certifications: skills
        }),
      })

      console.log('[DEBUG] Update Response Status:', response.status)
      
      // Log raw response for debugging
      const rawResponse = await response.text()
      console.log('[DEBUG] Raw Update Response:', rawResponse)
      
      if (!response.ok) {
        console.error('[DEBUG] Update failed with status:', response.status)
        throw new Error('Failed to update coach profile: ' + rawResponse)
      }
      
      // Try to parse the response
      let responseData
      try {
        responseData = JSON.parse(rawResponse)
        console.log('[DEBUG] Parsed Update Response:', responseData)
      } catch (parseError) {
        console.error('[DEBUG] Failed to parse update response:', parseError)
        throw new Error('Invalid JSON response from server')
      }
      
      toast.success(responseData.message || 'Coach profile updated successfully')
    } catch (error) {
      console.error('[COACH_PROFILE_UPDATE_ERROR] Detailed error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error(error instanceof Error 
        ? `Error updating coach profile: ${error.message}` 
        : 'An unexpected error occurred'
      )
    } finally {
      setCoachLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-8">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Realtor Profile</h2>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName" 
                    {...register('companyName')}
                    className={errors.companyName ? 'border-red-500' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500">{errors.companyName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input 
                    id="licenseNumber" 
                    {...register('licenseNumber', { required: 'License number is required' })}
                    className={errors.licenseNumber ? 'border-red-500' : ''}
                  />
                  {errors.licenseNumber && (
                    <p className="text-sm text-red-500">{errors.licenseNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    id="phoneNumber" 
                    {...register('phoneNumber')}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          {!isLoading && userRole === 'realtor_coach' && (
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Coach Profile</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCoachSubmit(onCoachSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Primary Specialty</Label>
                    <Input
                      id="specialty"
                      placeholder="Your main coaching specialty"
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

          {!isLoading && (
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">
                  {coachApplication ? 'Coach Application' : 'Coach Profile'}
                </h2>
              </CardHeader>
              <CardContent>
                {coachApplication ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Status</Label>
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
                ) : (
                  <CoachApplicationForm />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
