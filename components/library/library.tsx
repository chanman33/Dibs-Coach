"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Video, FileText, ExternalLink, Lock, Filter, X, Home, Wallet, Building, FileCheck, Shield, Building2, Clock } from "lucide-react"
import { useCentralizedAuth } from '@/app/provider'
import { REAL_ESTATE_DOMAINS } from "@/utils/types/coach"
import { fetchUserCapabilities } from "@/utils/actions/user-profile-actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"

type ResourceType = "article" | "video" | "course"
type ResourceAccess = "free" | "premium" | "affiliate"

interface Resource {
  id: string
  title: string
  description: string
  type: ResourceType
  access: ResourceAccess
  url?: string
  domains: string[]
  roles: string[]
  thumbnail?: string
  partner?: string
  status?: string
}

// Domain options with icons
const DOMAIN_OPTIONS = [
  {
    id: REAL_ESTATE_DOMAINS.REALTOR,
    label: "Real Estate Agent",
    icon: <Home className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.INVESTOR,
    label: "Real Estate Investor",
    icon: <Wallet className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.MORTGAGE,
    label: "Mortgage Professional",
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.PROPERTY_MANAGER,
    label: "Property Manager",
    icon: <Building className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.TITLE_ESCROW,
    label: "Title & Escrow",
    icon: <FileCheck className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.INSURANCE,
    label: "Insurance",
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.COMMERCIAL,
    label: "Commercial Real Estate",
    icon: <Building2 className="h-4 w-4" />
  },
  {
    id: REAL_ESTATE_DOMAINS.PRIVATE_CREDIT,
    label: "Private Credit",
    icon: <Wallet className="h-4 w-4" />
  }
];

// Sample resources - in a real app, these would come from a database
const SAMPLE_RESOURCES: Resource[] = [
  {
    id: "1",
    title: "Getting Started as a Real Estate Agent",
    description: "A comprehensive guide for new agents entering the real estate market.",
    type: "article",
    access: "free",
    url: "#",
    domains: [REAL_ESTATE_DOMAINS.REALTOR],
    roles: ["mentee", "coach"],
    thumbnail: "/images/placeholder.jpg"
  },
  {
    id: "2",
    title: "Advanced Coaching Techniques",
    description: "Learn how to effectively coach real estate professionals to reach their goals.",
    type: "video",
    access: "free",
    url: "#",
    domains: [REAL_ESTATE_DOMAINS.REALTOR],
    roles: ["coach"],
    thumbnail: "/images/placeholder.jpg"
  },
  {
    id: "3",
    title: "Real Estate Income Calculator Guide",
    description: "Learn how to use the income calculator to project your earnings.",
    type: "article",
    access: "free",
    url: "#",
    domains: [REAL_ESTATE_DOMAINS.REALTOR],
    roles: ["mentee", "coach"],
    thumbnail: "/images/placeholder.jpg"
  },
  {
    id: "4",
    title: "Premium Listing Presentation",
    description: "Professional presentation to help you win more listings.",
    type: "article",
    access: "premium",
    url: "#",
    domains: [REAL_ESTATE_DOMAINS.REALTOR],
    roles: ["mentee", "coach"],
    thumbnail: "/images/placeholder.jpg"
  },
  {
    id: "5",
    title: "Real Estate Master Course",
    description: "Complete real estate training from beginner to expert. Provided by RealtyMastery.",
    type: "course",
    access: "affiliate",
    partner: "RealtyMastery",
    domains: [REAL_ESTATE_DOMAINS.REALTOR],
    roles: ["mentee", "coach"],
    thumbnail: "/images/placeholder.jpg"
  },
  {
    id: "6",
    title: "Coaching Business Growth Strategies",
    description: "Scale your coaching business with proven strategies and systems.",
    type: "course",
    access: "affiliate",
    partner: "CoachPro",
    domains: [REAL_ESTATE_DOMAINS.REALTOR],
    roles: ["coach"],
    thumbnail: "/images/placeholder.jpg"
  },
  // Additional resources for different domains
  {
    id: "7",
    title: "Mortgage Lending Fundamentals",
    description: "Essential knowledge for mortgage professionals to succeed in today's market.",
    type: "course",
    access: "free",
    url: "#",
    domains: [REAL_ESTATE_DOMAINS.MORTGAGE],
    roles: ["mentee", "coach"],
    thumbnail: "/images/placeholder.jpg"
  },
  {
    id: "8",
    title: "Property Management Best Practices",
    description: "Learn how to efficiently manage properties and maximize returns.",
    type: "article",
    access: "free",
    url: "#",
    domains: [REAL_ESTATE_DOMAINS.PROPERTY_MANAGER],
    roles: ["mentee", "coach"],
    thumbnail: "/images/placeholder.jpg"
  },
  {
    id: "9",
    title: "Commercial Real Estate Analysis",
    description: "Advanced techniques for analyzing commercial real estate opportunities.",
    type: "video",
    access: "premium",
    url: "#",
    domains: [REAL_ESTATE_DOMAINS.COMMERCIAL],
    roles: ["mentee", "coach"],
    thumbnail: "/images/placeholder.jpg"
  },
  {
    id: "10",
    title: "Real Estate Investment Strategies",
    description: "Proven strategies for successful real estate investing in any market.",
    type: "course",
    access: "premium",
    url: "#",
    domains: [REAL_ESTATE_DOMAINS.INVESTOR],
    roles: ["mentee", "coach"],
    thumbnail: "/images/placeholder.jpg"
  }
]

export function Library() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [userRole, setUserRole] = useState<string>("")
  const [userDomains, setUserDomains] = useState<string[]>([])
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [showCoachOnly, setShowCoachOnly] = useState<boolean>(false)
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState<number>(0)
  const { authData: authContext } = useCentralizedAuth()

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        // Determine user role from URL path
        const path = window.location.pathname
        const role = path.includes("/coach") ? "coach" : "mentee"
        setUserRole(role)

        // Fetch user domains
        const result = await fetchUserCapabilities()
        if (result.data) {
          const { realEstateDomains } = result.data
          setUserDomains(realEstateDomains || [])
        }
      } catch (error) {
        console.error("[FETCH_USER_INFO_ERROR]", error)
      }
    }

    getUserInfo()
  }, [])

  useEffect(() => {
    // Calculate active filters count
    let count = 0
    if (selectedDomains.length > 0) count++
    if (showCoachOnly) count++
    setActiveFiltersCount(count)
  }, [selectedDomains, showCoachOnly])

  useEffect(() => {
    if (!userRole) return

    // Filter resources based on user role, domains, and selected tab
    let resources = SAMPLE_RESOURCES.filter(resource => {
      // Filter by role - only coaches can see coach-only content
      if (resource.roles.includes("coach") && !resource.roles.includes("mentee") && userRole !== "coach") {
        return false
      }

      // Filter by selected domains if any are selected
      if (selectedDomains.length > 0) {
        const hasMatchingDomain = resource.domains.some(domain => selectedDomains.includes(domain))
        if (!hasMatchingDomain) return false
      }

      // Filter by coach-only content if selected
      if (showCoachOnly && !resource.roles.includes("coach")) {
        return false
      }

      // Filter by tab selection
      if (activeTab !== "all" && resource.type !== activeTab) return false

      return true
    })

    setFilteredResources(resources)
  }, [activeTab, userRole, selectedDomains, showCoachOnly])

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "course":
        return <BookOpen className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getAccessBadge = (access: ResourceAccess) => {
    switch (access) {
      case "free":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Free</Badge>
      case "premium":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Premium</Badge>
      case "affiliate":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partner</Badge>
      default:
        return null
    }
  }

  const handleDomainChange = (domainId: string) => {
    setSelectedDomains(prev => {
      if (prev.includes(domainId)) {
        return prev.filter(d => d !== domainId)
      } else {
        return [...prev, domainId]
      }
    })
  }

  const clearFilters = () => {
    setSelectedDomains([])
    setShowCoachOnly(false)
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Resource Library</h1>
            <p className="text-muted-foreground">
              Explore our collection of resources to help you grow your {userRole === "coach" ? "coaching business" : "real estate career"}.
            </p>
          </div>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Resources</SheetTitle>
                <SheetDescription>
                  Customize your resource library view
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Real Estate Domains</h3>
                  <div className="space-y-2">
                    {DOMAIN_OPTIONS.map((domain) => (
                      <div key={domain.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`domain-${domain.id}`} 
                          checked={selectedDomains.includes(domain.id)}
                          onCheckedChange={() => handleDomainChange(domain.id)}
                        />
                        <Label 
                          htmlFor={`domain-${domain.id}`}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          {domain.icon}
                          <span>{domain.label}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {userRole === "coach" && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Content Type</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="coach-only" 
                        checked={showCoachOnly}
                        onCheckedChange={(checked) => setShowCoachOnly(!!checked)}
                      />
                      <Label 
                        htmlFor="coach-only"
                        className="text-sm cursor-pointer"
                      >
                        Coach-only content
                      </Label>
                    </div>
                  </div>
                )}
              </div>
              <SheetFooter className="flex flex-row justify-between sm:justify-between gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear filters
                </Button>
                <SheetClose asChild>
                  <Button>Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="article">Articles</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="course">Courses</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {activeFiltersCount > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {selectedDomains.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <span>Domains: {selectedDomains.length}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 p-0 ml-1" 
                      onClick={() => setSelectedDomains([])}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {showCoachOnly && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <span>Coach-only</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 p-0 ml-1" 
                      onClick={() => setShowCoachOnly(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs" 
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.length > 0 ? (
                filteredResources.map((resource) => (
                  <Card key={resource.id} className="overflow-hidden flex flex-col h-full">
                    <div className="h-40 bg-gray-100 relative">
                      {resource.thumbnail ? (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                            {getResourceIcon(resource.type)}
                          </div>
                        </div>
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          resource.type === "article" ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
                          resource.type === "video" ? "bg-gradient-to-r from-purple-500 to-pink-500" :
                          "bg-gradient-to-r from-amber-500 to-orange-500"
                        }`}>
                          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                            {getResourceIcon(resource.type)}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {getAccessBadge(resource.access)}
                      </div>
                      <div className="absolute top-2 left-2 flex gap-1">
                        {resource.roles.includes("coach") && !resource.roles.includes("mentee") && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Coach Only</Badge>
                        )}
                        {resource.status === "coming_soon" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
                        )}
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {getResourceIcon(resource.type)}
                        <span className="text-xs text-gray-500 uppercase">{resource.type}</span>
                        {resource.domains.length > 0 && (
                          <div className="flex items-center gap-1 ml-auto">
                            {resource.domains.map(domain => {
                              const domainOption = DOMAIN_OPTIONS.find(d => d.id === domain)
                              return domainOption ? (
                                <div key={domain} className="tooltip" data-tip={domainOption.label}>
                                  {domainOption.icon}
                                </div>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                      <CardTitle className="mt-2">{resource.title}</CardTitle>
                      {resource.partner && (
                        <div className="text-sm text-muted-foreground">
                          Provided by: {resource.partner}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow pb-2">
                      <CardDescription>{resource.description}</CardDescription>
                    </CardContent>
                    <CardFooter className="mt-auto pt-2">
                      <Button 
                        className="w-full" 
                        variant={resource.status === "coming_soon" ? "outline" : "default"}
                        disabled={resource.status === "coming_soon"}
                      >
                        {resource.status === "coming_soon" ? (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Coming Soon
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Coming Soon
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-lg font-medium">No resources found</h3>
                  <p className="text-muted-foreground">
                    We couldn't find any resources matching your criteria.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Affiliate Courses Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Featured Partner Courses</h2>
            <Button variant="outline">View All</Button>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-dashed flex flex-col h-full">
              <div className="h-40 bg-gray-100 relative">
                <div className="w-full h-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partner</Badge>
                </div>
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
                  <div className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs text-gray-500 uppercase">Course</span>
                </div>
                <CardTitle className="mt-2">Complete Real Estate Business Blueprint</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Provided by: RealtyMastery
                </div>
              </CardHeader>
              <CardContent className="flex-grow pb-2">
                <CardDescription>
                  A comprehensive course covering everything you need to build a successful real estate business from the ground up.
                </CardDescription>
              </CardContent>
              <CardFooter className="mt-auto pt-2">
                <Button className="w-full" variant="outline" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-dashed flex flex-col h-full">
              <div className="h-40 bg-gray-100 relative">
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                  <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partner</Badge>
                </div>
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
                  {userRole === "coach" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Coach Only</Badge>
                  )}
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs text-gray-500 uppercase">Course</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="mt-2">Advanced Coaching Certification</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Provided by: CoachPro
                </div>
              </CardHeader>
              <CardContent className="flex-grow pb-2">
                <CardDescription>
                  Become a certified real estate coach and help others achieve their goals while building a profitable coaching business.
                </CardDescription>
              </CardContent>
              <CardFooter className="mt-auto pt-2">
                <Button className="w-full" variant="outline" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-dashed flex flex-col h-full">
              <div className="h-40 bg-gray-100 relative">
                <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partner</Badge>
                </div>
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
                  <div className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs text-gray-500 uppercase">Course</span>
                </div>
                <CardTitle className="mt-2">Real Estate Marketing Mastery</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Provided by: MarketingPro
                </div>
              </CardHeader>
              <CardContent className="flex-grow pb-2">
                <CardDescription>
                  Learn cutting-edge marketing strategies specifically designed for real estate professionals to attract more clients.
                </CardDescription>
              </CardContent>
              <CardFooter className="mt-auto pt-2">
                <Button className="w-full" variant="outline" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
