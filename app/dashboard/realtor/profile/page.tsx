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

interface RealtorProfileFormData {
  companyName: string
  licenseNumber: string
  phoneNumber: string
  bio: string
  careerStage: string
  goals: string
  brokerId?: string | null
  teamId?: string | null
}

export default function RealtorProfilePage() {
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { 
    register, 
    handleSubmit, 
    setValue,
    formState: { errors }
  } = useForm<RealtorProfileFormData>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const profileResponse = await fetch('/api/user/realtor')
        if (!profileResponse.ok) {
          const errorData = await profileResponse.json().catch(() => ({}))
          throw new Error(errorData?.message || 'Failed to fetch profile')
        }
        const profileData = await profileResponse.json()

        console.log('[PROFILE_FETCH] Received profile data:', profileData)

        if (profileData) {
          setValue('companyName', profileData.companyName || '')
          setValue('licenseNumber', profileData.licenseNumber || '')
          setValue('phoneNumber', profileData.phoneNumber || '')
          setValue('bio', profileData.bio || '')
          setValue('careerStage', profileData.careerStage || '')
          setValue('goals', profileData.goals || '')
          
          console.log('[PROFILE_FETCH] Form values set:', {
            companyName: profileData.companyName,
            licenseNumber: profileData.licenseNumber,
            phoneNumber: profileData.phoneNumber,
            bio: profileData.bio,
            careerStage: profileData.careerStage,
            goals: profileData.goals
          })
        }
      } catch (error) {
        console.error('[PROFILE_FETCH_ERROR]', error)
        toast.error('Error loading profile data: ' + (error instanceof Error ? error.message : 'Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [setValue])

  const onSubmit = async (data: RealtorProfileFormData) => {
    setLoading(true)
    try {
      console.log('[PROFILE_UPDATE] Form data:', {
        companyName: data.companyName || null,
        licenseNumber: data.licenseNumber || null,
        phoneNumber: data.phoneNumber || null,
        bio: data.bio || null,
        careerStage: data.careerStage || null,
        goals: data.goals || null
      })

      const response = await fetch('/api/user/realtor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.companyName || null,
          licenseNumber: data.licenseNumber || null,
          phoneNumber: data.phoneNumber || null,
          bio: data.bio || null,
          careerStage: data.careerStage || null,
          goals: data.goals || null
        }),
      })

      console.log('[PROFILE_UPDATE] Response status:', response.status)
      
      const rawResponse = await response.text()
      console.log('[PROFILE_UPDATE] Raw response:', rawResponse)

      let responseData
      try {
        responseData = JSON.parse(rawResponse)
        console.log('[PROFILE_UPDATE] Parsed response data:', responseData)
      } catch (parseError) {
        console.error('[PROFILE_UPDATE] Failed to parse response:', parseError)
        throw new Error('Invalid server response')
      }

      if (!response.ok) {
        console.error('[PROFILE_UPDATE] Server error:', responseData)
        throw new Error(responseData.message || responseData.error || 'Failed to update profile')
      }
      
      toast.success(responseData.message || 'Profile updated successfully')
    } catch (error) {
      console.error('[PROFILE_UPDATE_ERROR] Full error:', error)
      toast.error(error instanceof Error 
        ? `Error updating profile: ${error.message}` 
        : 'An unexpected error occurred'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-8">
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
                <Input id="phoneNumber" {...register('phoneNumber')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" {...register('bio')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="careerStage">Career Stage</Label>
                <Input 
                  id="careerStage" 
                  placeholder="e.g., Beginner, Intermediate, Expert"
                  {...register('careerStage')} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Professional Goals</Label>
                <Textarea 
                  id="goals" 
                  placeholder="What are your professional goals?"
                  {...register('goals')} 
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
