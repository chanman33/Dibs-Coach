"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Settings, Users, BarChart3, PlusCircle, ArrowUpDown, Search, Check, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Simple Heading component
interface HeadingProps {
  title: string;
  description: string;
}

function Heading({ title, description }: HeadingProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

// Mock data - would be replaced with API calls in production
const PLANS = [
  {
    id: "plan_business",
    name: "Business",
    description: "Team access with per-seat pricing",
    price: 29,
    billingPeriods: ["monthly", "annual"],
    features: [
      "Discounted coaching sessions",
      "Advanced AI tools",
      "Priority support",
      "Team management",
      "SSO authentication"
    ],
    isActive: true,
    type: "per_seat"
  },
  {
    id: "plan_enterprise",
    name: "Enterprise",
    description: "Custom enterprise solution",
    price: null, // Custom pricing
    billingPeriods: ["monthly", "annual", "custom"],
    features: [
      "Unlimited coaching sessions",
      "Advanced AI tools",
      "Dedicated support",
      "Team management",
      "SSO authentication",
      "Custom integrations"
    ],
    isActive: true,
    type: "custom"
  },
  {
    id: "plan_starter",
    name: "Starter",
    description: "Small team essential features",
    price: 19,
    billingPeriods: ["monthly", "annual"],
    features: [
      "Pay-as-you-go coaching sessions",
      "Basic AI tools",
      "Standard support",
      "Limited team management"
    ],
    isActive: false,
    type: "per_seat"
  }
];

const ORGANIZATIONS = [
  {
    id: "org1",
    name: "Acme Real Estate",
    plan: "Business",
    seats: 25,
    billingCycle: "monthly",
    status: "active",
    mrr: 725,
    nextBillingDate: "2023-05-15"
  },
  {
    id: "org2",
    name: "Metro Properties",
    plan: "Enterprise",
    seats: 50,
    billingCycle: "annual",
    status: "active",
    mrr: 1200,
    nextBillingDate: "2023-08-01"
  },
  {
    id: "org3",
    name: "Highland Realty",
    plan: "Business",
    seats: 10,
    billingCycle: "monthly",
    status: "active",
    mrr: 290,
    nextBillingDate: "2023-05-22"
  },
  {
    id: "org4",
    name: "Sunset Homes",
    plan: "Business",
    seats: 8,
    billingCycle: "annual",
    status: "past_due",
    mrr: 232,
    nextBillingDate: "2023-05-10"
  },
  {
    id: "org5",
    name: "Cascade Properties",
    plan: "Business",
    seats: 15,
    billingCycle: "monthly",
    status: "active",
    mrr: 435,
    nextBillingDate: "2023-05-30"
  }
];

const REVENUE_METRICS = {
  mrr: 2882,
  arr: 34584,
  activeSubscriptions: 5,
  averageSeatCount: 21.6,
  totalSeats: 108,
  churnRate: 0.5,
  growth: 12.5
};

export default function SystemBillingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [plans, setPlans] = useState(PLANS);
  const [organizations, setOrganizations] = useState(ORGANIZATIONS);
  const [metrics, setMetrics] = useState(REVENUE_METRICS);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter organizations by search term
  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    org.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleTogglePlanStatus = (planId: string) => {
    setPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId ? {...plan, isActive: !plan.isActive} : plan
      )
    );
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
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <Heading title="System Billing Management" description="Manage platform-wide billing, subscription plans, and organization billing" />
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Subscription Plan</DialogTitle>
              <DialogDescription>
                Define a new plan that organizations can subscribe to.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Plan Name
                </Label>
                <Input id="name" placeholder="e.g. Professional" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input id="description" placeholder="Brief plan description" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price per Seat
                </Label>
                <div className="col-span-3 flex items-center">
                  <span className="mr-2">$</span>
                  <Input id="price" placeholder="e.g. 29" type="number" />
                  <span className="ml-2">USD</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="billing-type" className="text-right">
                  Billing Type
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select billing type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_seat">Per-Seat</SelectItem>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Billing Periods
                </Label>
                <div className="col-span-3 flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="monthly" />
                    <Label htmlFor="monthly">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="annual" />
                    <Label htmlFor="annual">Annual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="custom-period" />
                    <Label htmlFor="custom-period">Custom</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plan Management</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Monthly Recurring Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${metrics.mrr.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="text-green-500">↑ {metrics.growth}%</span> vs last month
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Active Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.activeSubscriptions}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="text-destructive">↓ {metrics.churnRate}%</span> churn rate
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Seats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalSeats}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Avg {metrics.averageSeatCount} seats per organization
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Plan Distribution</CardTitle>
                  <CardDescription>
                    Current breakdown of active organizations by plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-muted-foreground">Chart visualization would go here</div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Subscription Changes</CardTitle>
                    <CardDescription>
                      New subscriptions and plan changes in the last 30 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Organization</TableHead>
                          <TableHead>Change</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Highland Realty</TableCell>
                          <TableCell>New Subscription (Business)</TableCell>
                          <TableCell>Apr 22, 2023</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Metro Properties</TableCell>
                          <TableCell>Upgraded (Business → Enterprise)</TableCell>
                          <TableCell>Apr 15, 2023</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Acme Real Estate</TableCell>
                          <TableCell>Added 5 seats</TableCell>
                          <TableCell>Apr 10, 2023</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Forecast</CardTitle>
                    <CardDescription>
                      Projected revenue for the next 6 months
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] flex items-center justify-center">
                      <div className="text-muted-foreground">Forecast chart would go here</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="plans" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <>
              <div className="grid gap-4">
                {plans.map(plan => (
                  <Card key={plan.id} className={!plan.isActive ? "opacity-70" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {plan.name}
                            <Badge variant={plan.isActive ? "default" : "outline"}>
                              {plan.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button 
                            variant={plan.isActive ? "destructive" : "default"} 
                            size="sm"
                            onClick={() => handleTogglePlanStatus(plan.id)}
                          >
                            {plan.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Price per Seat</div>
                          <div className="font-medium">{plan.price ? `$${plan.price}/mo` : "Custom Pricing"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Billing Type</div>
                          <div className="font-medium capitalize">{plan.type.replace('_', ' ')}</div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">Billing Periods</div>
                        <div className="flex gap-2">
                          {plan.billingPeriods.map(period => (
                            <Badge key={period} variant="secondary" className="capitalize">
                              {period}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">Features</div>
                        <ul className="space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500" /> {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="text-sm text-muted-foreground">
                        Organizations using this plan: {
                          organizations.filter(org => org.plan === plan.name).length
                        }
                      </div>
                      <Button variant="outline" size="sm">View Organizations</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="organizations" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="relative w-72">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Organization Subscriptions</CardTitle>
                  <CardDescription>
                    Manage billing for all organizations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Billing Cycle</TableHead>
                        <TableHead>MRR</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrganizations.map(org => (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell>{org.plan}</TableCell>
                          <TableCell>{org.seats}</TableCell>
                          <TableCell className="capitalize">{org.billingCycle}</TableCell>
                          <TableCell>${org.mrr}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={org.status === "active" ? "default" : "destructive"}
                              className="capitalize"
                            >
                              {org.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{org.nextBillingDate}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Manage</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button variant="outline">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Global Billing Settings</CardTitle>
                  <CardDescription>
                    Configure platform-wide billing policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Payment Providers</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <CreditCard className="h-8 w-8" />
                          <div>
                            <div className="font-medium">Stripe</div>
                            <div className="text-sm text-muted-foreground">Primary payment provider</div>
                          </div>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                        <div className="flex items-center gap-4">
                          <CreditCard className="h-8 w-8" />
                          <div>
                            <div className="font-medium">PayPal</div>
                            <div className="text-sm text-muted-foreground">Secondary payment provider</div>
                          </div>
                        </div>
                        <Badge variant="outline">Inactive</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Invoice Settings</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="invoice-prefix">Invoice Prefix</Label>
                          <Input id="invoice-prefix" defaultValue="INV-" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="due-days">Days until due</Label>
                          <Input id="due-days" type="number" defaultValue="14" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currency">Default Currency</Label>
                          <Select defaultValue="usd">
                            <SelectTrigger id="currency">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="usd">USD ($)</SelectItem>
                              <SelectItem value="eur">EUR (€)</SelectItem>
                              <SelectItem value="gbp">GBP (£)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="auto-collect" defaultChecked />
                        <Label htmlFor="auto-collect">Automatically collect payments for invoices</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="send-reminders" defaultChecked />
                        <Label htmlFor="send-reminders">Send payment reminders for unpaid invoices</Label>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Subscription Policies</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Grace Period for Failed Payments</div>
                          <div className="text-sm text-muted-foreground">Days before subscription is marked past due</div>
                        </div>
                        <Input className="w-20" type="number" defaultValue="7" />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Dunning Attempts</div>
                          <div className="text-sm text-muted-foreground">Number of retries for failed payments</div>
                        </div>
                        <Input className="w-20" type="number" defaultValue="3" />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Proration Behavior</div>
                          <div className="text-sm text-muted-foreground">How to handle partial billing periods</div>
                        </div>
                        <Select defaultValue="always">
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select behavior" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always prorate</SelectItem>
                            <SelectItem value="upgrade_only">Upgrades only</SelectItem>
                            <SelectItem value="none">No proration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Settings</Button>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 