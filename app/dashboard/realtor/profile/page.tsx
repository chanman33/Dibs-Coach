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

        if (profileData) {
          setValue('companyName', profileData.companyName || '')
          setValue('licenseNumber', profileData.licenseNumber || '')
          setValue('phoneNumber', profileData.phoneNumber || '')
          setValue('bio', profileData.bio || '')
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
      console.log('[PROFILE_UPDATE] Sending data:', data)
      const response = await fetch('/api/user/realtor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          brokerId: null,
          teamId: null
        }),
      })

      console.log('[PROFILE_UPDATE] Response status:', response.status)
      
      const responseData = await response.json()
      console.log('[PROFILE_UPDATE] Response data:', responseData)

      if (!response.ok) {
        throw new Error(responseData?.error || 'Failed to update profile')
      }
      
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('[PROFILE_UPDATE_ERROR] Full error:', error)
      toast.error('Error updating profile: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    setLoading(false)
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
