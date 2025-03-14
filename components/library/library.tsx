"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Video, FileText, ExternalLink, Lock } from "lucide-react"
import { useAuthContext } from "@/components/auth/providers"
import { REAL_ESTATE_DOMAINS } from "@/utils/types/coach"
import { fetchUserCapabilities } from "@/utils/actions/user-profile-actions"

type ResourceType = "article" | "video" | "course" | "template"
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
}

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
    title: "Premium Listing Presentation Templates",
    description: "Professional templates to help you win more listings.",
    type: "template",
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
  }
]

export function Library() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [userRole, setUserRole] = useState<string>("")
  const [userDomains, setUserDomains] = useState<string[]>([])
  const authContext = useAuthContext()

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
    if (!userRole) return

    // Filter resources based on user role, domains, and selected tab
    let resources = SAMPLE_RESOURCES.filter(resource => {
      // Filter by role
      if (!resource.roles.includes(userRole)) return false

      // Filter by domain if the resource has domain restrictions
      if (resource.domains.length > 0) {
        const hasMatchingDomain = resource.domains.some(domain => userDomains.includes(domain))
        if (!hasMatchingDomain) return false
      }

      // Filter by tab selection
      if (activeTab !== "all" && resource.type !== activeTab) return false

      return true
    })

    setFilteredResources(resources)
  }, [activeTab, userRole, userDomains])

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "course":
        return <BookOpen className="h-4 w-4" />
      case "template":
        return <FileText className="h-4 w-4" />
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource Library</h1>
          <p className="text-muted-foreground">
            Explore our collection of resources to help you grow your {userRole === "coach" ? "coaching business" : "real estate career"}.
          </p>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="article">Articles</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="course">Courses</TabsTrigger>
            <TabsTrigger value="template">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.length > 0 ? (
                filteredResources.map((resource) => (
                  <Card key={resource.id} className="overflow-hidden">
                    <div className="h-40 bg-gray-100 relative">
                      {resource.thumbnail ? (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">Resource Image</span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {getAccessBadge(resource.access)}
                      </div>
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {getResourceIcon(resource.type)}
                        <span className="text-xs text-gray-500 uppercase">{resource.type}</span>
                      </div>
                      <CardTitle className="mt-2">{resource.title}</CardTitle>
                      {resource.partner && (
                        <div className="text-sm text-muted-foreground">
                          Provided by: {resource.partner}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardContent>
                    <CardFooter>
                      {resource.access === "affiliate" ? (
                        <Button className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Learn More
                        </Button>
                      ) : resource.access === "premium" ? (
                        <Button className="w-full" variant="secondary">
                          <Lock className="h-4 w-4 mr-2" />
                          Unlock Premium
                        </Button>
                      ) : (
                        <Button className="w-full" variant="default">
                          View Resource
                        </Button>
                      )}
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
            <Card>
              <div className="h-40 bg-gray-100 relative">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Course Image</span>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partner</Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs text-gray-500 uppercase">Course</span>
                </div>
                <CardTitle className="mt-2">Complete Real Estate Business Blueprint</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Provided by: RealtyMastery
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  A comprehensive course covering everything you need to build a successful real estate business from the ground up.
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <div className="h-40 bg-gray-100 relative">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Course Image</span>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partner</Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs text-gray-500 uppercase">Course</span>
                </div>
                <CardTitle className="mt-2">Advanced Coaching Certification</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Provided by: CoachPro
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Become a certified real estate coach and help others achieve their goals while building a profitable coaching business.
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <div className="h-40 bg-gray-100 relative">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Course Image</span>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partner</Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs text-gray-500 uppercase">Course</span>
                </div>
                <CardTitle className="mt-2">Real Estate Marketing Mastery</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Provided by: MarketingPro
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Learn cutting-edge marketing strategies specifically designed for real estate professionals to attract more clients.
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
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
