"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { fetchOrganizationById, updateOrganization } from '@/utils/actions/organization-actions'
import { OrganizationDetailsPanel } from '../_components/organization-details-panel'
import { OrganizationMembersPanel } from '../_components/organization-members-panel'
import { OrganizationSettingsPanel } from '../_components/organization-settings-panel'
import { OrganizationActivityPanel } from '../_components/organization-activity-panel'
import { OrganizationAnalyticsPanel } from '../_components/organization-analytics-panel'

interface PageProps {
  params: {
    id: string
  }
}

export default function OrganizationDetailPage({ params }: PageProps) {
  const { id } = params
  const { toast } = useToast()
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        setLoading(true)
        setError('')
        const result = await fetchOrganizationById(id)
        
        if (result.error) {
          setError(result.error)
          return
        }
        
        setOrganization(result.data)
      } catch (err) {
        console.error('[LOAD_ORGANIZATION_ERROR]', err)
        setError('Failed to load organization details')
      } finally {
        setLoading(false)
      }
    }

    loadOrganization()
  }, [id])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleUpdate = async (updatedData: any) => {
    try {
      const result = await updateOrganization({ 
        orgId: id,
        ...updatedData
      })
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
        return
      }
      
      // Update the local state
      setOrganization({
        ...organization,
        ...updatedData
      })
      
      toast({
        title: 'Success',
        description: 'Organization updated successfully'
      })
    } catch (error) {
      console.error('[UPDATE_ORGANIZATION_ERROR]', error)
      toast({
        title: 'Error',
        description: 'Failed to update organization',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-12 w-[300px] mb-6" />
        <div className="grid gap-4">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="space-y-2 pb-4 border-b mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Organization Details</h1>
          <p className="text-muted-foreground">View and manage organization information</p>
        </div>
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="space-y-2 pb-4 border-b mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
        <p className="text-muted-foreground">Organization ID: {organization.ulid}</p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-0">
          <OrganizationDetailsPanel organization={organization} onUpdate={handleUpdate} />
        </TabsContent>
        
        <TabsContent value="members" className="mt-0">
          <OrganizationMembersPanel orgId={id} />
        </TabsContent>
        
        <TabsContent value="activity" className="mt-0">
          <OrganizationActivityPanel orgId={id} />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-0">
          <OrganizationAnalyticsPanel orgId={id} />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-0">
          <OrganizationSettingsPanel organization={organization} onUpdate={handleUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 