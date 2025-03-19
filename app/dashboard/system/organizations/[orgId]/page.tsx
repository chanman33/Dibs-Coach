"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, ArrowLeft, Edit, Users, Settings, BarChart3, CreditCard, Clock, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { fetchOrganizationById } from '@/utils/actions/organization-actions'
import { Separator } from '@/components/ui/separator'
import { OrganizationDetailsPanel } from '../_components/organization-details-panel'
import { OrganizationMembersPanel } from '../_components/organization-members-panel'
import { OrganizationSettingsPanel } from '../_components/organization-settings-panel'
import { OrganizationActivityPanel } from '../_components/organization-activity-panel'
import { OrganizationAnalyticsPanel } from '../_components/organization-analytics-panel'
import { OrganizationBillingPanel } from '../_components/organization-billing-panel'
import config from '@/config'
import { Suspense } from 'react'

// Use the global configuration to determine if billing is enabled
const BILLING_ENABLED = config.payments.enabled

interface OrganizationDetailPageProps {
  params: {
    orgId: string
  }
}

function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  // Extract orgId from the URL pathname instead of using params directly
  const pathname = usePathname()
  const orgId = pathname.split('/').pop() || ''
  
  const router = useRouter()
  const { toast } = useToast()
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  
  // Handle URL hash for tab selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (hash && ['details', 'members', 'analytics', 'billing', 'activity', 'settings'].includes(hash)) {
        setActiveTab(hash)
      }
    }
  }, [])
  
  useEffect(() => {
    loadOrganization()
  }, [orgId])
  
  const loadOrganization = async () => {
    try {
      setLoading(true)
      console.log(`Attempting to fetch organization with ID: ${orgId}`)
      const result = await fetchOrganizationById(orgId)
      
      if (result.error) {
        console.error('[FETCH_ORGANIZATION_ERROR_DETAILS]', {
          orgId,
          error: result.error,
          pathUsed: pathname
        })
        toast({
          title: 'Error',
          description: `Failed to load organization: ${result.error}`,
          variant: 'destructive'
        })
        
        // If we couldn't find the organization, show a message
        setOrganization(null)
        return
      }

      if (!result.data) {
        console.warn('[FETCH_ORGANIZATION_WARNING]', 'No data returned but no error either')
        setOrganization(null)
        return
      }

      console.log('[ORGANIZATION_FOUND]', result.data)
      setOrganization(result.data)
    } catch (err) {
      console.error('[FETCH_ORGANIZATION_ERROR]', err)
      toast({
        title: 'Error',
        description: 'Failed to load organization details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'default'
      case 'INACTIVE':
        return 'secondary'
      case 'SUSPENDED':
        return 'destructive'
      case 'PENDING':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-72" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="container py-6">
        <div className="mb-6">
          <Link href="/dashboard/system/organizations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h3 className="text-lg font-medium">Organization Not Found</h3>
              <p className="text-muted-foreground mt-2">
                The organization you're looking for doesn't exist or you don't have access.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => router.push('/dashboard/system/organizations')}
              >
                Return to Organizations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6">
      {/* Header & Actions */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/system/organizations">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{organization.name}</h1>
            <Badge variant={getBadgeVariant(organization.status)}>
              {organization.status}
            </Badge>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          ID: {organization.ulid} • Created: {new Date(organization.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Organization Overview Card */}
      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Organization Type</span>
            <span className="font-medium">{organization.type}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Industry</span>
            <span className="font-medium">{organization.industry || 'Not specified'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Subscription Tier</span>
            <span className="font-medium">{organization.tier}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Members</span>
            <span className="font-medium">{organization.memberCount || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid ${BILLING_ENABLED ? 'grid-cols-6' : 'grid-cols-5'} w-full`}>
          <TabsTrigger value="details">
            <Building2 className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          {BILLING_ENABLED && (
            <TabsTrigger value="billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </TabsTrigger>
          )}
          <TabsTrigger value="activity">
            <Clock className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <OrganizationDetailsPanel organization={organization} onUpdate={loadOrganization} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <OrganizationMembersPanel orgId={orgId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <OrganizationAnalyticsPanel orgId={orgId} />
        </TabsContent>

        {BILLING_ENABLED && (
          <TabsContent value="billing" className="space-y-4">
            <OrganizationBillingPanel orgId={orgId} />
          </TabsContent>
        )}

        <TabsContent value="activity" className="space-y-4">
          <OrganizationActivityPanel orgId={orgId} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <OrganizationSettingsPanel organization={organization} onUpdate={loadOrganization} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function OrganizationDetailPageWrapper(props: OrganizationDetailPageProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-[400px] w-full" />
      </div>
    }>
      <OrganizationDetailPage {...props} />
    </Suspense>
  )
} 