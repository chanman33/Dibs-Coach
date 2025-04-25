"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, CreditCard, CalendarClock, Users, TrendingUp, AlertCircle, Edit, Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { OrganizationBillingPanel } from "@/app/dashboard/system/organizations/_components/organization-billing-panel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface OrganizationBillingPageProps {
  params: {
    orgId: string
  }
}

export default function OrganizationBillingPage({ params }: OrganizationBillingPageProps) {
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
        plan: "Business",
        seats: {
          total: 25,
          used: 18,
          available: 7
        },
        billingCycle: "monthly",
        amount: 725, // $29 * 25 seats
        nextBillingDate: "2023-05-15",
        status: "active",
        createdAt: "2023-02-15",
        paymentHistory: [
          { id: "inv_123456", date: "2023-04-15", amount: 725, status: "paid" },
          { id: "inv_123455", date: "2023-03-15", amount: 696, status: "paid" },
          { id: "inv_123454", date: "2023-02-15", amount: 696, status: "paid" }
        ],
        usageData: {
          sessionsBooked: 43,
          sessionsCompleted: 38,
          totalSpent: 3870,
          avgSessionCost: 101.84
        }
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
          Manage organization billing, subscription, and usage details
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="management">Billing Management</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Subscription Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{organization.plan}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${organization.amount.toFixed(2)} / {organization.billingCycle}
                        </p>
                      </div>
                      <Badge variant={organization.status === "active" ? "default" : "destructive"}>
                        {organization.status}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Change Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Subscription Plan</DialogTitle>
                          <DialogDescription>
                            Update the subscription plan for {organization.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plan" className="text-right">
                              Plan
                            </Label>
                            <Select defaultValue={organization.plan}>
                              <SelectTrigger className="w-full col-span-3">
                                <SelectValue placeholder="Select plan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Business">Business ($29/seat)</SelectItem>
                                <SelectItem value="Enterprise">Enterprise (Custom)</SelectItem>
                                <SelectItem value="Starter">Starter ($19/seat)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cycle" className="text-right">
                              Billing Cycle
                            </Label>
                            <Select defaultValue={organization.billingCycle}>
                              <SelectTrigger className="w-full col-span-3">
                                <SelectValue placeholder="Select billing cycle" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="annual">Annual (10% discount)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="seats" className="text-right">
                              Total Seats
                            </Label>
                            <div className="col-span-3 flex items-center">
                              <Input 
                                id="seats" 
                                type="number" 
                                defaultValue={organization.seats.total} 
                                className="w-20" 
                              />
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({organization.seats.used} in use)
                              </span>
                            </div>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-4 items-center gap-4">
                            <div className="text-right font-medium">New Amount</div>
                            <div className="col-span-3 text-lg font-bold">
                              ${organization.amount.toFixed(2)} / {organization.billingCycle}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <div className="text-right text-sm text-muted-foreground">Next billing</div>
                            <div className="col-span-3 text-sm">
                              {organization.nextBillingDate} (Prorated)
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Seat Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{organization.seats.used} / {organization.seats.total}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {organization.seats.available} seats available
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Progress 
                      value={(organization.seats.used / organization.seats.total) * 100} 
                      className="h-2 mt-2" 
                    />
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Seats
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Next Billing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{organization.nextBillingDate}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${organization.amount.toFixed(2)}
                        </p>
                      </div>
                      <CalendarClock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      Update Payment Method
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Billing Summary</CardTitle>
                  <CardDescription>
                    Overview of recent billing activity and upcoming charges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Recent Payment</div>
                          <div className="text-sm text-muted-foreground">
                            ${organization.paymentHistory[0].amount.toFixed(2)} on {organization.paymentHistory[0].date}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Paid</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Seat Utilization</div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round((organization.seats.used / organization.seats.total) * 100)}% of purchased seats in use
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Optimize</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Usage Trend</div>
                          <div className="text-sm text-muted-foreground">
                            {organization.usageData.sessionsBooked} sessions booked, {organization.usageData.sessionsCompleted} completed
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View Report</Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline">Download Invoice</Button>
                  <Button>View Details</Button>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="management" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <div>
              <OrganizationBillingPanel orgId={orgId} />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    Complete record of billing transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organization.paymentHistory.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.id}</TableCell>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell>${payment.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "paid" ? "default" : "destructive"}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{organization.plan}</TableCell>
                          <TableCell>{
                            payment.id === "inv_123456" ? "25" :
                            payment.id === "inv_123455" ? "24" :
                            payment.id === "inv_123454" ? "24" : "—"
                          }</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing recent 3 of 12 invoices
                  </div>
                  <Button variant="outline">View All Invoices</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Administrative Actions</CardTitle>
                  <CardDescription>
                    Special billing adjustments and actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-1">Issue Credit</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add account credit to this organization
                      </p>
                      <Button variant="outline" size="sm">Issue Credit</Button>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-1">Manual Invoice</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create a custom one-time invoice
                      </p>
                      <Button variant="outline" size="sm">Create Invoice</Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                      <h3 className="font-medium mb-1">Cancel Subscription</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        End recurring billing for this organization
                      </p>
                      <Button variant="destructive" size="sm">Cancel</Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>These actions will be logged for audit purposes</span>
                  </div>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 