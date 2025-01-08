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
  skills: string
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

export default function RealtorProfilePage() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [coachLoading, setCoachLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [coachApplication, setCoachApplication] = useState<any>(null)
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
        console.log('[PROFILE_PAGE] Starting profile fetch')
        const profileResponse = await fetch('/api/user/realtor')

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json().catch(() => ({}))
          throw new Error(errorData?.message || 'Failed to fetch profile')
        }

        const profileData = await profileResponse.json()
        console.log('[PROFILE_PAGE] Raw profile data:', profileData)

        // Set form values from response
        console.log('[PROFILE_PAGE] Setting form values:', {
          companyName: profileData.companyName,
          licenseNumber: profileData.licenseNumber,
          phoneNumber: profileData.phoneNumber
        })

        setValue('companyName', profileData.companyName || '')
        setValue('licenseNumber', profileData.licenseNumber || '')
        setValue('phoneNumber', profileData.phoneNumber || '')
        setUserRole(profileData.role || 'realtor') // Default to realtor if not specified

        // Show coach application for both realtors and admins, but only fetch their own application
        if (profileData.role === 'realtor' || profileData.role === 'admin') {
          try {
            // Force fetch only the current user's application
            const applicationData = await getCoachApplication();
            console.log('[DEBUG] Current user coach application:', {
              userId: profileData.id,
              applicationData
            });
            
            // Filter to only get the current user's application
            const userApplication = applicationData?.find(app => app.applicantDbId === profileData.id);
            setCoachApplication(userApplication);
          } catch (error) {
            // Ignore coach application errors
            console.log('No coach application found for current user');
          }
        }

        // Only fetch coach profile if user is a coach
        if (profileData.role === 'realtor_coach' && userId) {
          try {
            console.log('[DEBUG] Fetching coach profile for realtor_coach...')
            console.log('[DEBUG] Current user - Clerk ID:', userId)
            
            const { data: coachData, error } = await fetchCoachByClerkId(userId)
            
            if (error) {
              console.error('[DEBUG] API returned error:', error)
              throw error
            }

            console.log('[DEBUG] Coach Data:', coachData)
            
            if (!coachData) {
              console.error('[DEBUG] No coach profile found for current user')
              throw new Error('No coach profile found for current user')
            }

            const coachProfile = coachData.RealtorCoachProfile
            console.log('[DEBUG] Current User Coach Profile:', coachProfile)
            
            if (!coachProfile) {
              console.error('[DEBUG] Coach found but no RealtorCoachProfile exists')
              throw new Error('Coach profile data not found')
            }
            
            // Set coach profile form values
            setCoachValue('specialty', coachProfile.specialty || '')
            setCoachValue('bio', coachProfile.bio || '')
            setCoachValue('experience', coachProfile.experience || '')
            // Convert array to comma-separated string for the input field
            setCoachValue('specialties', Array.isArray(coachProfile.specialties) ? coachProfile.specialties.join(', ') : '')
            setCoachValue('skills', Array.isArray(coachProfile.certifications) ? coachProfile.certifications.join(', ') : '')
            
            console.log('[DEBUG] Form values set successfully')
          } catch (error) {
            console.error('[COACH_PROFILE_FETCH_ERROR] Detailed error:', {
              error,
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              clerkId: userId
            })
            toast.error('Error loading coach profile: ' + 
              (error instanceof Error ? error.message : 'Unknown error'))
          }
        }
      } catch (error) {
        console.error('[PROFILE_FETCH_ERROR]', error)
        toast.error('Error loading profile data: ' + (error instanceof Error ? error.message : 'Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [setValue, userId])

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
      
      const response = await fetch('/api/user/coach', {
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
                    onChange={(e) => console.log('Company name changed:', e.target.value)}
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
                    onChange={(e) => console.log('License number changed:', e.target.value)}
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
                    onChange={(e) => console.log('Phone number changed:', e.target.value)}
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
          {!isLoading && (userRole === 'realtor' || userRole === 'admin') && (
            <CoachApplicationForm existingApplication={coachApplication} />
          )}

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
                      placeholder="List your coaching specialties (e.g., New Agents, Luxury Market, Team Building)"
                      {...registerCoach('specialties')}
                      className={coachErrors.specialties ? 'border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills</Label>
                    <Input 
                      id="skills" 
                      placeholder="Enter your key skills (comma-separated)"
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
        </div>
      </div>
    </div>
  )
}
