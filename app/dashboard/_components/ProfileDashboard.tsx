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

interface CoachProfileFormData {
  specialty: string
  bio: string
  experience: string
  specialties: string
  skills: string  // maps to certifications
}

interface ProfileDashboardProps {
  userId: string
  userRole: string
}

export function ProfileDashboard({ userId, userRole }: ProfileDashboardProps) {
  const [coachLoading, setCoachLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const isCoach = userRole === 'realtor_coach' || userRole === 'loan_officer_coach'

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
        
        if (isCoach) {
          try {
            setCoachLoading(true)
            const coachResponse = await fetch('/api/user/coach/profile')
            if (!coachResponse.ok) {
              const errorData = await coachResponse.json()
              throw new Error(errorData.error || 'Failed to load coach profile')
            }
            const coachData = await coachResponse.json()
            
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
      } catch (error) {
        console.error('[PROFILE_DASHBOARD_FETCH_ERROR]', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [userId, userRole, setCoachValue, isCoach])

  const onCoachSubmit = async (data: CoachProfileFormData) => {
    setCoachLoading(true)
    try {
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
                  <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                  <Textarea 
                    id="specialties" 
                    placeholder="List your coaching specialties (e.g., Lead Gen, Negotiation)"
                    {...registerCoach('specialties')}
                    className={coachErrors.specialties ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Certifications & Skills (comma-separated)</Label>
                  <Input 
                    id="skills" 
                    placeholder="Enter your certifications (e.g., GRI, CRS)"
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
  )
} 