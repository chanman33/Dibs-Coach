"use client"

import { useEffect, useState } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ContainerLoading } from "@/components/loading"
import { BookOpen, FileText, Video, PlayCircle, Eye, Clock, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ResourceItem {
  id: string
  title: string
  type: "article" | "video" | "course"
  description: string
  duration: string
  tags: string[]
  image?: string
  link: string
}

export default function OrganizationResourcesPage() {
  const { organizationName, organizationRole, isLoading } = useOrganization()
  const router = useRouter()
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(true)

  useEffect(() => {
    // Redirect if not in an organization
    if (!isLoading && !organizationName) {
      router.push('/dashboard/mentee')
      return
    }

    // Mock fetching resources - would be replaced with real API call
    if (organizationName) {
      // Simulate API call
      setTimeout(() => {
        setResources([
          {
            id: "res-001",
            title: "Team Productivity Strategies",
            type: "article",
            description: "Learn effective strategies for boosting team productivity in a remote work environment.",
            duration: "10 min read",
            tags: ["productivity", "teamwork", "remote work"],
            link: "/dashboard/resource-library/article/team-productivity"
          },
          {
            id: "res-002",
            title: "Leadership Development Series",
            type: "course",
            description: "A comprehensive course on developing leadership skills for real estate professionals.",
            duration: "5 modules",
            tags: ["leadership", "management", "development"],
            link: "/dashboard/resource-library/course/leadership-development"
          },
          {
            id: "res-003",
            title: "Client Relationship Management",
            type: "video",
            description: "Expert tips on building and maintaining strong client relationships.",
            duration: "25 min",
            tags: ["client management", "communication", "sales"],
            link: "/dashboard/resource-library/video/client-relationship-management"
          },
          {
            id: "res-004",
            title: "Market Analysis Fundamentals",
            type: "article",
            description: "Understanding market trends and analysis techniques for real estate professionals.",
            duration: "15 min read",
            tags: ["market analysis", "trends", "data"],
            link: "/dashboard/resource-library/article/market-analysis"
          },
          {
            id: "res-005",
            title: "Negotiation Tactics Workshop",
            type: "video",
            description: "Advanced negotiation techniques to close more deals.",
            duration: "45 min",
            tags: ["negotiation", "sales", "communication"],
            link: "/dashboard/resource-library/video/negotiation-tactics"
          }
        ])
        setIsLoadingResources(false)
      }, 1000)
    }
  }, [organizationName, isLoading, router])

  if (isLoading) {
    return (
      <ContainerLoading
        message="Loading organization..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }

  if (isLoadingResources) {
    return (
      <ContainerLoading
        message="Loading resources..."
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }

  // Separate resources by type
  const articles = resources.filter(r => r.type === "article")
  const videos = resources.filter(r => r.type === "video")
  const courses = resources.filter(r => r.type === "course")

  const ResourceCard = ({ resource }: { resource: ResourceItem }) => {
    const TypeIcon = 
      resource.type === "article" ? FileText : 
      resource.type === "video" ? Video : 
      BookOpen
    
    return (
      <Link href={resource.link}>
        <Card className="h-full hover:border-blue-200 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <TypeIcon className="h-4 w-4 text-blue-500" />
                <Badge variant="outline" className="capitalize">
                  {resource.type}
                </Badge>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {resource.duration}
              </div>
            </div>
            <CardTitle className="text-lg mt-2">{resource.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="line-clamp-2">
              {resource.description}
            </CardDescription>
            <div className="flex flex-wrap gap-1 mt-3">
              {resource.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <BookOpen className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">{organizationName} Resources</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/resource-library">
            Browse Full Library <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="articles" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="videos" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="courses" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>About Organization Resources</CardTitle>
          <CardDescription>
            Exclusive content provided by {organizationName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            These resources have been specially curated for members of your organization to help you 
            develop professionally and excel in your role. New content is added regularly to keep 
            you up-to-date with the latest industry trends and best practices.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 