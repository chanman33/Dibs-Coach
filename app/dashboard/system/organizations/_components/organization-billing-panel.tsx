"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { CreditCard, AlertCircle, Plus, Minus, Users, CreditCardIcon, CalendarClock, TrendingUp } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import config from "@/config"

interface OrganizationBillingPanelProps {
  orgId: string
}

export function OrganizationBillingPanel({ orgId }: OrganizationBillingPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock data - would be fetched from API
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
  });
  
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
  ]);
  
  const [usageData, setUsageData] = useState({
    sessionsBooked: 43,
    sessionsCompleted: 38,
    totalSpent: 3870,
    avgSessionCost: 101.84,
    topCoaches: [
      { name: "John Smith", sessions: 12 },
      { name: "Emily Johnson", sessions: 8 },
      { name: "Michael Davis", sessions: 6 }
    ]
  });
  
  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
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
    }));
  };
  
  const handleRemoveSeats = () => {
    // Would trigger API call with validation
    if (subscriptionData.seats.total <= subscriptionData.seats.used) return;
    
    setSubscriptionData(prev => ({
      ...prev,
      seats: {
        total: prev.seats.total - 1,
        used: prev.seats.used,
        available: prev.seats.available - 1
      },
      amount: (prev.seats.total - 1) * 29
    }));
  };
  
  const handleChangeBillingCycle = () => {
    // Would trigger API call
    setSubscriptionData(prev => ({
      ...prev,
      billingCycle: prev.billingCycle === "Monthly" ? "Annual" : "Monthly",
      amount: prev.billingCycle === "Monthly" 
        ? Math.round(prev.seats.total * 29 * 12 * 0.9) / 12 // 10% discount
        : prev.seats.total * 29
    }));
  };
  
  const renderSkeletonLoading = () => (
    <div className="space-y-3">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
  
  if (!config.payments.enabled) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing & Subscription
            </CardTitle>
            <CardDescription>
              Manage billing information and subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Billing Not Available</AlertTitle>
              <AlertDescription>
                Billing functionality is not fully implemented yet. It's currently disabled in the system configuration (config.payments.enabled is set to {String(config.payments.enabled)}).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing & Subscription
          </CardTitle>
          <CardDescription>
            Manage subscription, seats, payment methods, and view usage analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="seats">Seat Management</TabsTrigger>
              <TabsTrigger value="payment">Payment Methods</TabsTrigger>
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
                        <Button variant="outline" size="sm" className="w-full">
                          Change Plan
                        </Button>
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
                        <Button variant="outline" size="sm" className="w-full" onClick={handleRemoveSeats} disabled={subscriptionData.seats.total <= subscriptionData.seats.used}>
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        View All Invoices
                      </Button>
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
                      <CardTitle className="text-lg">Seat Management</CardTitle>
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
                          <Button variant="outline" size="sm" onClick={handleRemoveSeats} disabled={subscriptionData.seats.total <= subscriptionData.seats.used}>
                            <Minus className="h-4 w-4 mr-1" /> Remove Seats
                          </Button>
                          <Button variant="default" size="sm" onClick={handleAddSeats}>
                            <Plus className="h-4 w-4 mr-1" /> Add Seats
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
                            <TableHead>Role</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">John Smith</TableCell>
                            <TableCell>john.smith@example.com</TableCell>
                            <TableCell>Manager</TableCell>
                            <TableCell>Apr 2, 2023</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">Revoke</Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Emma Johnson</TableCell>
                            <TableCell>emma.j@example.com</TableCell>
                            <TableCell>Employee</TableCell>
                            <TableCell>Apr 10, 2023</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">Revoke</Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Michael Davis</TableCell>
                            <TableCell>m.davis@example.com</TableCell>
                            <TableCell>Employee</TableCell>
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
                      <CardTitle className="text-lg">Payment Methods</CardTitle>
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
                                <Button variant="ghost" size="sm">PDF</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">Billing Address</Button>
                      <Button>Add Payment Method</Button>
                    </CardFooter>
                  </Card>
                </>
              )}
            </TabsContent>
            
            
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 