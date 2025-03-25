"use client"

import { useState, useEffect } from "react"
import { CreditCard, Plus, Minus, Users, CreditCardIcon, CalendarClock, TrendingUp, Download, History, ReceiptIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { RouteGuardProvider } from "@/components/auth/RouteGuardContext"
import Link from "next/link"
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

export default function BusinessBillingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Mock data for the UI
  const [subscriptionData, setSubscriptionData] = useState({
    plan: "Business",
    seats: {
      total: 25,
      used: 18,
      available: 7
    },
    billingCycle: "Monthly",
    amount: 725, // $29 * 25 seats
    nextBillingDate: "2023-05-15",
    status: "active",
    paymentMethod: {
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2024
    }
  })
  
  const [invoices, setInvoices] = useState([
    {
      id: "inv_123456",
      date: "2023-04-15",
      amount: 725,
      status: "paid"
    },
    {
      id: "inv_123455",
      date: "2023-03-15",
      amount: 696,
      status: "paid"
    },
    {
      id: "inv_123454",
      date: "2023-02-15",
      amount: 696,
      status: "paid"
    }
  ])
  
  const [usageData, setUsageData] = useState({
    sessionsBooked: 43,
    sessionsCompleted: 38,
    totalSpent: 3870,
    avgSessionCost: 101.84,
    departmentSpending: [
      { name: "Sales", sessions: 19, spend: 1920, percentage: 49.6 },
      { name: "Marketing", sessions: 12, spend: 1210, percentage: 31.3 },
      { name: "Operations", sessions: 7, spend: 740, percentage: 19.1 }
    ],
    budgets: {
      companyTotal: 5000,
      used: 3870,
      remaining: 1130,
      departments: [
        { name: "Sales", allocated: 2500, used: 1920, remaining: 580 },
        { name: "Marketing", allocated: 1500, used: 1210, remaining: 290 },
        { name: "Operations", allocated: 1000, used: 740, remaining: 260 }
      ]
    }
  })
  
  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])
  
  const handleAddSeats = () => {
    // Would trigger API call
    setSubscriptionData(prev => ({
      ...prev,
      seats: {
        total: prev.seats.total + 1,
        used: prev.seats.used,
        available: prev.seats.available + 1
      },
      amount: (prev.seats.total + 1) * 29
    }))
  }
  
  const handleRemoveSeats = () => {
    // Would trigger API call with validation
    if (subscriptionData.seats.total <= subscriptionData.seats.used) return
    
    setSubscriptionData(prev => ({
      ...prev,
      seats: {
        total: prev.seats.total - 1,
        used: prev.seats.used,
        available: prev.seats.available - 1
      },
      amount: (prev.seats.total - 1) * 29
    }))
  }
  
  const handleChangeBillingCycle = () => {
    // Would trigger API call
    setSubscriptionData(prev => ({
      ...prev,
      billingCycle: prev.billingCycle === "Monthly" ? "Annual" : "Monthly",
      amount: prev.billingCycle === "Monthly" 
        ? Math.round(prev.seats.total * 29 * 12 * 0.9) / 12 // 10% discount
        : prev.seats.total * 29
    }))
  }
  
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
    <RouteGuardProvider required="business-dashboard">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription, seats, payment methods, and view usage analytics
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="seats">Seat Management</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
            <TabsTrigger value="budgets">Budgets & Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              renderSkeletonLoading()
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Subscription Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl font-bold">{subscriptionData.plan}</span>
                        <Badge>{subscriptionData.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${subscriptionData.amount.toFixed(2)} / {subscriptionData.billingCycle.toLowerCase()}
                      </div>
                      <div className="text-sm mt-2">
                        Next billing date: {subscriptionData.nextBillingDate}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            Change Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Subscription Plan</DialogTitle>
                            <DialogDescription>
                              Upgrade or downgrade your subscription plan
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="plan" className="text-right">
                                Plan
                              </Label>
                              <Select defaultValue={subscriptionData.plan}>
                                <SelectTrigger className="w-full col-span-3">
                                  <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Business">Business ($29/seat)</SelectItem>
                                  <SelectItem value="Enterprise">Enterprise (Custom)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="cycle" className="text-right">
                                Billing Cycle
                              </Label>
                              <Select defaultValue={subscriptionData.billingCycle}>
                                <SelectTrigger className="w-full col-span-3">
                                  <SelectValue placeholder="Select billing cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Monthly">Monthly</SelectItem>
                                  <SelectItem value="Annual">Annual (10% discount)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Change Plan</Button>
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
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl font-bold">{subscriptionData.seats.used} / {subscriptionData.seats.total}</span>
                        <Badge variant="outline">{subscriptionData.seats.available} available</Badge>
                      </div>
                      <Progress value={(subscriptionData.seats.used / subscriptionData.seats.total) * 100} className="h-2 mt-1 mb-2" />
                      <div className="text-sm text-muted-foreground">
                        ${(29 * subscriptionData.seats.total).toFixed(2)} total for {subscriptionData.seats.total} seats
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full" 
                        onClick={handleRemoveSeats} 
                        disabled={subscriptionData.seats.total <= subscriptionData.seats.used}
                      >
                        <Minus className="h-4 w-4 mr-1" /> Remove
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" onClick={handleAddSeats}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map(invoice => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.id}</TableCell>
                            <TableCell>{invoice.date}</TableCell>
                            <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={invoice.status === "paid" ? "default" : "destructive"}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4 mr-1" /> PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/business/settings/billing/invoices" className="w-full">
                      <Button variant="outline" size="sm" className="w-full">
                        View All Invoices
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg mb-4 border">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <CreditCardIcon className="h-10 w-10 text-primary" />
                          <div>
                            <div className="font-medium">
                              {subscriptionData.paymentMethod.brand.toUpperCase()} ending in {subscriptionData.paymentMethod.last4}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Expires {subscriptionData.paymentMethod.expMonth}/{subscriptionData.paymentMethod.expYear}
                            </div>
                          </div>
                        </div>
                        <Badge>Default</Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/business/settings/billing/payment-methods" className="w-full">
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Payment Methods
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="seats" className="space-y-4">
            {isLoading ? (
              renderSkeletonLoading()
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Seat Management</CardTitle>
                    <CardDescription>Manage seat licenses and assignments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-lg font-semibold">Total Seats: {subscriptionData.seats.total}</div>
                        <div className="text-sm text-muted-foreground">
                          {subscriptionData.seats.used} assigned • {subscriptionData.seats.available} available
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRemoveSeats} 
                          disabled={subscriptionData.seats.total <= subscriptionData.seats.used}
                        >
                          <Minus className="h-4 w-4 mr-1" /> Remove Seats
                        </Button>
                        <Button variant="default" size="sm" onClick={handleAddSeats}>
                          <Plus className="h-4 w-4 mr-1" /> Add Seats
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center px-4 py-2 bg-muted rounded-lg mb-4">
                      <div className="text-sm">Current cost: ${(subscriptionData.seats.total * 29).toFixed(2)} / month</div>
                      <div className="text-sm">
                        <Button variant="ghost" size="sm" onClick={handleChangeBillingCycle}>
                          Switch to {subscriptionData.billingCycle === "Monthly" ? "Annual" : "Monthly"} billing
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="mb-2 font-medium">Assigned Users</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Assigned</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">John Smith</TableCell>
                          <TableCell>john.smith@example.com</TableCell>
                          <TableCell>Sales</TableCell>
                          <TableCell>Apr 2, 2023</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Revoke</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Emma Johnson</TableCell>
                          <TableCell>emma.j@example.com</TableCell>
                          <TableCell>Marketing</TableCell>
                          <TableCell>Apr 10, 2023</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Revoke</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Michael Davis</TableCell>
                          <TableCell>m.davis@example.com</TableCell>
                          <TableCell>Operations</TableCell>
                          <TableCell>Apr 12, 2023</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Revoke</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">View All Users</Button>
                    <Button>Assign Seats</Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="payment" className="space-y-4">
            {isLoading ? (
              renderSkeletonLoading()
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Manage your payment information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg mb-4 border">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <CreditCardIcon className="h-10 w-10 text-primary" />
                          <div>
                            <div className="font-medium">
                              {subscriptionData.paymentMethod.brand.toUpperCase()} ending in {subscriptionData.paymentMethod.last4}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Expires {subscriptionData.paymentMethod.expMonth}/{subscriptionData.paymentMethod.expYear}
                            </div>
                          </div>
                        </div>
                        <Badge>Default</Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Billing Cycle</div>
                        <div className="text-sm text-muted-foreground">
                          Currently {subscriptionData.billingCycle.toLowerCase()}
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleChangeBillingCycle}>
                        Switch to {subscriptionData.billingCycle === "Monthly" ? "Annual" : "Monthly"}
                      </Button>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="mb-2 font-medium">Billing History</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Download</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map(invoice => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.id}</TableCell>
                            <TableCell>{invoice.date}</TableCell>
                            <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={invoice.status === "paid" ? "default" : "destructive"}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4 mr-1" /> PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Update Billing Address</Button>
                    <Button>Add Payment Method</Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="budgets" className="space-y-4">
            {isLoading ? (
              renderSkeletonLoading()
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Overview</CardTitle>
                    <CardDescription>Track your coaching spending budget</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                      <div className="bg-muted p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">Total Budget</div>
                        <div className="text-2xl font-bold">${usageData.budgets.companyTotal}</div>
                        <Progress 
                          value={(usageData.budgets.used / usageData.budgets.companyTotal) * 100} 
                          className="h-2 mt-2 mb-1" 
                        />
                        <div className="text-sm flex justify-between">
                          <span>Used: ${usageData.budgets.used}</span>
                          <span>Remaining: ${usageData.budgets.remaining}</span>
                        </div>
                      </div>
                      
                      {usageData.budgets.departments.map((dept, index) => (
                        <div key={index} className="bg-muted p-4 rounded-lg border">
                          <div className="text-sm text-muted-foreground mb-1">{dept.name} Budget</div>
                          <div className="text-2xl font-bold">${dept.allocated}</div>
                          <Progress 
                            value={(dept.used / dept.allocated) * 100} 
                            className="h-2 mt-2 mb-1" 
                          />
                          <div className="text-sm flex justify-between">
                            <span>Used: ${dept.used}</span>
                            <span>Remaining: ${dept.remaining}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mb-4">
                      <div className="font-medium mb-2">Department Spending Breakdown</div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Department</TableHead>
                            <TableHead>Allocated</TableHead>
                            <TableHead>Spent</TableHead>
                            <TableHead>Remaining</TableHead>
                            <TableHead>Sessions</TableHead>
                            <TableHead>% of Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usageData.budgets.departments.map((dept, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{dept.name}</TableCell>
                              <TableCell>${dept.allocated}</TableCell>
                              <TableCell>${dept.used}</TableCell>
                              <TableCell>${dept.remaining}</TableCell>
                              <TableCell>{usageData.departmentSpending[index]?.sessions || 0}</TableCell>
                              <TableCell>{usageData.departmentSpending[index]?.percentage || 0}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">
                      <History className="h-4 w-4 mr-2" />
                      View Spending History
                    </Button>
                    <Button>
                      <ReceiptIcon className="h-4 w-4 mr-2" />
                      Update Budgets
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Statistics</CardTitle>
                    <CardDescription>Coaching session metrics and analytics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                      <div className="bg-muted p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">Sessions Booked</div>
                        <div className="text-2xl font-bold">{usageData.sessionsBooked}</div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">Sessions Completed</div>
                        <div className="text-2xl font-bold">{usageData.sessionsCompleted}</div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">Total Spent</div>
                        <div className="text-2xl font-bold">${usageData.totalSpent}</div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">Avg Session Cost</div>
                        <div className="text-2xl font-bold">${usageData.avgSessionCost.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="h-64 flex items-center justify-center border rounded-lg mb-4">
                      <div className="text-muted-foreground">Monthly spending chart would go here</div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button variant="outline">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Detailed Analytics
                    </Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </RouteGuardProvider>
  )
}
