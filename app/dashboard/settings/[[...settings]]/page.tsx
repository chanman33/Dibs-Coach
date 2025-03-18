"use client"

import config from '@/config'
import { UserProfile } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { USER_CAPABILITIES } from "@/utils/roles/roles"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter, useSearchParams } from "next/navigation"
import { fetchUserCapabilities, type UserCapabilitiesResponse } from "@/utils/actions/user-profile-actions"
import { type ApiResponse } from "@/utils/types/api"
import { Loader2, Building, Building2, Search, Users2, Network, ArrowRight, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { useOrganization } from '@/utils/auth/OrganizationContext'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

// Map organization types to icons and colors
const orgTypeConfig: Record<string, { icon: any, color: string }> = {
  INDIVIDUAL: { icon: Building, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  TEAM: { icon: Users2, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  BUSINESS: { icon: Building2, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  ENTERPRISE: { icon: Building2, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  FRANCHISE: { icon: Network, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  NETWORK: { icon: Network, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

// Map org roles to display names and colors
const roleConfig: Record<string, { label: string, color: string }> = {
  OWNER: { label: 'Owner', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  MANAGER: { label: 'Manager', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  MEMBER: { label: 'Member', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  VIEWER: { label: 'Viewer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
};

// Map org status to colors
const statusConfig: Record<string, { color: string }> = {
  ACTIVE: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  INACTIVE: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  SUSPENDED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  ARCHIVED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
};

// Format date
const formatDate = (dateString: string) => {
  try {
    // Check if the date is valid before formatting
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Recently added";
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error("[DATE_FORMAT_ERROR]", error);
    return "Recently added";
  }
};

export default function Settings() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [userCapabilities, setUserCapabilities] = useState<string[]>([])
  const [loadingCapabilities, setLoadingCapabilities] = useState(true)
  const isCoach = userCapabilities.includes('COACH')
  const [activeTab, setActiveTab] = useState("account")
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilterTab, setOrgFilterTab] = useState('all');
  const { organizations, organizationUlid, setOrganizationUlid, isLoading: isLoadingOrgs } = useOrganization();
  const searchParams = useSearchParams();

  // Set the active tab based on the URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    
    console.log('[SETTINGS_PAGE_DEBUG] URL params change detected:', {
      tab,
      currentTab: activeTab,
      success: searchParams.get('success'),
      error: searchParams.get('error'),
      timestamp: new Date().toISOString()
    })

    if (tab && ['account', 'organizations', 'notifications', 'subscription'].includes(tab)) {
      setActiveTab(tab);
    }
    
    // Check for success or error messages in URL
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success) {
      toast.success('Operation completed successfully!');
      
      // Create a new URLSearchParams without the success parameter
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('success');
      
      // Update the URL without the success parameter
      router.replace(`/dashboard/settings?${newParams.toString()}`, { scroll: false });
    } else if (error) {
      console.error('[SETTINGS_PAGE_DEBUG] Processing error:', {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error(`Error: ${error}`);
      
      // Create a new URLSearchParams without the error parameter
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('error');
      
      // Update the URL without the error parameter
      router.replace(`/dashboard/settings?${newParams.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  // When a tab is clicked, update the URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Create a new URLSearchParams
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    
    // Log the tab change
    console.log('[SETTINGS_PAGE_DEBUG] Tab changed manually:', {
      newTab: value,
      params: newParams.toString(),
      timestamp: new Date().toISOString()
    });
    
    // Replace the current URL with the new one
    router.replace(`/dashboard/settings?${newParams.toString()}`, { scroll: false });
  };

  useEffect(() => {
    async function loadUserCapabilities() {
      if (user?.id) {
        console.log('[SETTINGS_PAGE_DEBUG] Loading capabilities:', {
          userId: user.id,
          timestamp: new Date().toISOString()
        })
        try {
          const result: ApiResponse<UserCapabilitiesResponse> = await fetchUserCapabilities()
          
          if (result.error) {
            throw result.error
          }

          if (result.data) {
            console.log('[SETTINGS_PAGE_DEBUG] Capabilities loaded:', {
              capabilities: result.data.capabilities,
              timestamp: new Date().toISOString()
            })
            setUserCapabilities(result.data.capabilities)
          }
        } catch (error) {
          console.error("[SETTINGS_PAGE_DEBUG] Capabilities fetch error:", {
            error,
            timestamp: new Date().toISOString()
          })
          setUserCapabilities([])
        }
        setLoadingCapabilities(false)
      }
    }

    loadUserCapabilities()
  }, [user?.id])

  // Debug render
  console.log('[SETTINGS_PAGE_DEBUG] Rendering:', {
    isCoach,
    activeTab,
    loadingCapabilities,
    timestamp: new Date().toISOString()
  })

  if (loadingCapabilities) {
    console.log('[SETTINGS_PAGE_DEBUG] Loading capabilities')
    return <div>Loading...</div>
  }

  // Filter organizations by search term and tab
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.organization.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = orgFilterTab === 'all' || 
      (orgFilterTab === 'active' && org.organization.status === 'ACTIVE') ||
      (orgFilterTab === 'owner' && org.role === 'OWNER') ||
      (orgFilterTab === 'member' && org.role === 'MEMBER');
    
    return matchesSearch && matchesTab;
  });

  const renderOrganizationsContent = () => {
    if (isLoadingOrgs) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden flex flex-col">
              <CardHeader className="p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-7 w-48" />
                </div>
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-3 mt-auto">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setOrgFilterTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="owner">Owner</TabsTrigger>
            <TabsTrigger value="member">Member</TabsTrigger>
          </TabsList>
          
          <TabsContent value={orgFilterTab} className="mt-0">
            {filteredOrganizations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No organizations found</h3>
                <p className="text-muted-foreground mt-2 mb-6">
                  {searchTerm 
                    ? `No organizations matching '${searchTerm}'` 
                    : 'You have no organizations in this category'}
                </p>
                <Button
                  onClick={() => router.push('/dashboard/organizations/create')}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" /> Create Organization
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredOrganizations.map((org) => {
                  const OrgIcon = orgTypeConfig[org.organization.type]?.icon || Building;
                  const typeColor = orgTypeConfig[org.organization.type]?.color || '';
                  const roleConfig_ = roleConfig[org.role] || { label: org.role, color: '' };
                  const statusColor = statusConfig[org.organization.status]?.color || '';
                  const isActive = org.organizationUlid === organizationUlid;

                  return (
                    <Card key={org.organizationUlid} className={`overflow-hidden transition-all hover:shadow-md ${isActive ? 'border-primary' : ''} flex flex-col`}>
                      <CardHeader className="p-6 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full ${typeColor}`}>
                              <OrgIcon className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl truncate max-w-[220px]">
                              {org.organization.name}
                            </CardTitle>
                          </div>
                          {isActive && (
                            <Badge variant="outline" className="gap-1 border-primary text-primary px-3 py-1">
                              <Check className="h-3.5 w-3.5" /> Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="secondary" className={`${roleConfig_.color} px-3 py-1`}>
                            {roleConfig_.label}
                          </Badge>
                          {(!isActive || org.organization.status !== 'ACTIVE') && (
                            <Badge variant="secondary" className={`${statusColor} px-3 py-1`}>
                              {org.organization.status}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-2 flex-1">
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Joined:</span>
                            <span>{formatDate(org.joinedAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-3 flex justify-center mt-auto">
                        {isActive ? (
                          <Button variant="secondary" className="w-full text-sm h-10" disabled>
                            Current Organization
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            className="w-full text-sm h-10" 
                            onClick={() => setOrganizationUlid(org.organizationUlid)}
                          >
                            Switch to this Organization
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
          <TabsTrigger
            value="account"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Account
          </TabsTrigger>
          <TabsTrigger
            value="organizations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Organizations
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4 mt-6">
          {config?.auth?.enabled && (
            <Card className="p-0 border-none">
              <UserProfile
                appearance={{
                  elements: {
                    card: "!border !border-solid !border-border bg-background text-foreground rounded-lg shadow-none",
                    navbar: "!border-b !border-solid !border-border",
                    rootBox: "[&_*]:!shadow-none [&>div]:bg-background [&>div]:!border [&>div]:!border-solid [&>div]:!border-border [&_.cl-card]:!border [&_.cl-card]:!border-solid [&_.cl-card]:!border-border",
                    pageScrollBox: "bg-background [&>div]:bg-background"
                  },
                  variables: {
                    borderRadius: "0.75rem"
                  }
                }}
              />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Organizations</CardTitle>
              <CardDescription>
                Manage your organization memberships and switch between organizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderOrganizationsContent()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="email-notifications" className="font-medium">Email Notifications</label>
                  <p className="text-sm text-muted-foreground">Receive email updates about your account activity</p>
                </div>
                <Switch id="email-notifications" />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="marketing-emails" className="font-medium">Marketing Emails</label>
                  <p className="text-sm text-muted-foreground">Receive emails about new features and updates</p>
                </div>
                <Switch id="marketing-emails" />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="reminder-notifications" className="font-medium">Session Reminders</label>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming sessions and events</p>
                </div>
                <Switch id="reminder-notifications" />
              </div>
              <Button disabled={loading} className="mt-4">
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <h3 className="font-medium">Current Plan</h3>
                  <p className="text-sm text-muted-foreground">Free Tier</p>
                </div>
                <Button variant="outline">Upgrade Plan</Button>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Billing History</h3>
                <p className="text-sm text-muted-foreground">No billing history available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 