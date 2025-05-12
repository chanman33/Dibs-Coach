"use client"

import { UserProfile } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Building, Building2, Users2, Network, ArrowRight, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { useOrganization } from '@/utils/auth/OrganizationContext'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { OrganizationMember } from '@/utils/auth/OrganizationContext'

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
  const [activeTab, setActiveTab] = useState("account")
  const orgContext = useOrganization();
  const searchParams = useSearchParams();

  // Set the active tab based on the URL parameter and handle success/error messages
  useEffect(() => {
    const tab = searchParams.get('tab');
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    console.log('[SETTINGS_PAGE_DEBUG] URL params change detected:', {
      tab,
      currentTab: activeTab,
      success,
      error,
      timestamp: new Date().toISOString()
    })

    // Determine the target tab
    let targetTab = activeTab;
    if (tab && ['account', 'organizations', 'notifications', 'subscription'].includes(tab)) {
      targetTab = tab;
    } else if (success === 'true') {
      // Default to account tab on generic success if no tab is specified, or adjust as needed
      targetTab = 'account';
    }

    // Update active tab state if needed
    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
    }

    // Process success/error messages - keep generic ones for now
    if (success === 'true') { // Only handle generic success='true' now
      toast.success('Operation completed successfully!');

      // Clean up URL parameters
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('success');
      newParams.delete('t'); // Remove timestamp if present
      if (!newParams.has('tab') && targetTab) {
        newParams.set('tab', targetTab); // Ensure tab is preserved/set in URL
      }
      router.replace(`/dashboard/settings?${newParams.toString()}`, { scroll: false });

    } else if (error) {
      console.error('[SETTINGS_PAGE_DEBUG] Processing error:', {
        error,
        timestamp: new Date().toISOString()
      });
       // Use error value as message if it's not just 'true'
       const errorMessage = error === 'true' ? 'An error occurred.' : error;
      toast.error(`Error: ${errorMessage}`);

      // Clean up URL parameters
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('error');
      newParams.delete('t'); // Remove timestamp if present
      if (!newParams.has('tab') && targetTab) {
        newParams.set('tab', targetTab); // Ensure tab is preserved/set in URL
      }
      router.replace(`/dashboard/settings?${newParams.toString()}`, { scroll: false });
    }
    // Removed calendar refresh functions from dependencies and logic
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, activeTab]); // Depend only on params, router, and activeTab

  // When a tab is clicked, update the URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Create a new URLSearchParams
    const newParams = new URLSearchParams(searchParams.toString());
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

  // Debug render with fewer details
  console.log('[SETTINGS_PAGE_DEBUG] Rendering:', {
    activeTab,
    timestamp: new Date().toISOString()
  });

  // Check if Organization context is loading
  if (!orgContext) {
    console.log('[SETTINGS_PAGE_DEBUG] Waiting for organization context...');
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Initializing settings...</p>
        </div>
      </div>
    );
  }

  // Destructure after confirming context is available
  const { organizations, organizationUlid, setOrganizationUlid, isLoading: isLoadingOrgs } = orgContext;

  // Updated loading check (removed loadingCapabilities)
  if (isLoadingOrgs) {
    console.log('[SETTINGS_PAGE_DEBUG] Loading organizations');
    // Return a more informative loading state
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

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
      <div className="max-h-[600px] overflow-y-auto pr-2">
        {organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No organizations found</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              You don't belong to any organizations yet
            </p>
            <Button
              onClick={() => router.push('/business-solutions')}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" /> Learn More
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
            {organizations.map((org: OrganizationMember) => {
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
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-8">
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

        <TabsContent value="account" className="mt-0">
          <div className="bg-background rounded-lg">
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
          </div>
        </TabsContent>

        <TabsContent value="organizations" className="mt-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">My Organizations</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your organization memberships and switch between organizations
                </p>
              </div>
            </div>
            {renderOrganizationsContent()}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <div className="border rounded-lg p-6 bg-background">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">
                  Choose what notifications you want to receive
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="email-notifications" className="font-medium">Email Notifications</label>
                    <p className="text-sm text-muted-foreground">Receive email updates about your account activity</p>
                  </div>
                  <Switch id="email-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="marketing-emails" className="font-medium">Marketing Emails</label>
                    <p className="text-sm text-muted-foreground">Receive emails about new features and updates</p>
                  </div>
                  <Switch id="marketing-emails" />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="reminder-notifications" className="font-medium">Session Reminders</label>
                    <p className="text-sm text-muted-foreground">Get notified about upcoming sessions and events</p>
                  </div>
                  <Switch id="reminder-notifications" />
                </div>
                <Button disabled={loading} className="mt-6">
                  {loading ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="mt-0">
          <div className="border rounded-lg p-6 bg-background">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Subscription Details</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your subscription and billing
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div>
                    <h3 className="font-medium">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">Free Tier</p>
                  </div>
                  <Button variant="outline">Upgrade Plan</Button>
                </div>
                <Separator />
                <div className="py-4">
                  <h3 className="font-medium mb-2">Billing History</h3>
                  <p className="text-sm text-muted-foreground">No billing history available</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
