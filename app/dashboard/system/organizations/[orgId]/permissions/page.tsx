"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Shield, UsersRound, Check, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { OrganizationRoleManagement } from "@/app/dashboard/system/organizations/_components/organization-role-management"

interface OrganizationPermissionsPageProps {
  params: {
    orgId: string
  }
}

export default function OrganizationPermissionsPage({ params }: OrganizationPermissionsPageProps) {
  const { orgId } = params
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [organization, setOrganization] = useState<any>(null)
  
  useEffect(() => {
    // Simulate API fetch for organization data
    const timer = setTimeout(() => {
      setOrganization({
        id: orgId,
        name: "Acme Real Estate",
        slug: "acme-real-estate",
        plan: "Business",
        members: 18,
        hasCustomPermissions: true,
        createdAt: "2023-02-15",
        activeTemplate: "enterprise",
        overrides: [
          { role: "member", permission: "BOOK_SESSIONS", value: "limited" },
          { role: "admin", permission: "MANAGE_BILLING", value: "granted" },
          { role: "billing_admin", permission: "VIEW_ANALYTICS", value: "revoked" }
        ]
      })
      setIsLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [orgId])
  
  const renderSkeletonLoading = () => (
    <div className="space-y-3">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
  
  return (
    <div className="space-y-6 p-6">
      <div>
        <Link 
          href={`/dashboard/system/organizations/${orgId}`} 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organization
        </Link>
        
        {isLoading ? (
          <Skeleton className="h-9 w-64" />
        ) : (
          <h1 className="text-3xl font-bold tracking-tight mb-1">{organization.name}</h1>
        )}
        <p className="text-sm text-muted-foreground">
          Manage organization-specific permissions and role configurations
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="overrides">Permission Overrides</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Role Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold capitalize">{organization.activeTemplate}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Extended roles configuration
                        </p>
                      </div>
                      <Badge variant="outline">Applied</Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      Change Template
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Custom Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{organization.overrides.length}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Permission overrides
                        </p>
                      </div>
                      <Badge variant={organization.hasCustomPermissions ? "default" : "outline"}>
                        {organization.hasCustomPermissions ? "Customized" : "Default"}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      View Overrides
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{organization.members}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Organization users
                        </p>
                      </div>
                      <UsersRound className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Members
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Permission Health</CardTitle>
                  <CardDescription>
                    Overview of organization permission configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                        <div>
                          <div className="font-medium">Role Configuration</div>
                          <div className="text-sm text-muted-foreground">All roles properly configured with appropriate permissions</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Healthy
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        <div>
                          <div className="font-medium">Custom Permission Overrides</div>
                          <div className="text-sm text-muted-foreground">Organization has 3 custom permission overrides</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                        Modified
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                        <div>
                          <div className="font-medium">Default Role Assignment</div>
                          <div className="text-sm text-muted-foreground">New members correctly assigned to "Member" role</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Healthy
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="roles" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <div>
              <OrganizationRoleManagement orgId={orgId} />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="overrides" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Permission Overrides</CardTitle>
                  <CardDescription>
                    System-enforced permission modifications for this organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Permission</TableHead>
                        <TableHead>Override</TableHead>
                        <TableHead>Standard Value</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organization.overrides.map((override: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium capitalize">{override.role}</TableCell>
                          <TableCell>{override.permission}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                override.value === "granted" ? "default" : 
                                override.value === "revoked" ? "destructive" : "outline"
                              }
                            >
                              {override.value}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {
                              override.value === "granted" ? "Not Granted" : 
                              override.value === "revoked" ? "Granted" : 
                              override.value === "limited" ? "Unlimited" : "Standard"
                            }
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Remove Override</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Reset All to Default</Button>
                  <Button>Add Permission Override</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Apply Template Overrides</CardTitle>
                  <CardDescription>
                    Apply a pre-defined set of permission overrides from templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-all">
                      <h3 className="font-medium mb-1">Restricted Access</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Limit coaching access and spending abilities
                      </p>
                      <Badge variant="outline">5 overrides</Badge>
                    </div>
                    
                    <div className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-all">
                      <h3 className="font-medium mb-1">Advanced Reporting</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Enable detailed reporting for all levels
                      </p>
                      <Badge variant="outline">3 overrides</Badge>
                    </div>
                    
                    <div className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-all">
                      <h3 className="font-medium mb-1">Coach Access Only</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Restrict to coaching services only
                      </p>
                      <Badge variant="outline">7 overrides</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Applying a template will replace all current overrides with the template configuration.
                  </p>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 