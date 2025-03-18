"use client"

import { useEffect, useState } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ContainerLoading } from "@/components/loading"
import { BookOpen, FileText, Video, Clock, ExternalLink, Download, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ResourceItem {
  id: string
  title: string
  type: "article" | "video" | "document" | "training"
  description: string
  duration: string
  tags: string[]
  image?: string
  link: string
  downloadable?: boolean
}

export default function CoachOrganizationResourcesPage() {
  const { organizationName, organizationRole, isLoading } = useOrganization()
  const router = useRouter()
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(true)

  useEffect(() => {
    // Redirect if not in an organization
    if (!isLoading && !organizationName) {
      router.push('/dashboard/coach')
      return
    }

    // Mock fetching resources - would be replaced with real API call
    if (organizationName) {
      // Simulate API call
      setTimeout(() => {
        setResources([
          {
            id: "res-001",
            title: "Coach Onboarding Materials",
            type: "document",
            description: "Complete onboarding guide for coaches partnering with our organization.",
            duration: "15 min read",
            tags: ["onboarding", "guidelines", "partnership"],
            link: "/dashboard/resource-library/document/coach-onboarding",
            downloadable: true
          },
          {
            id: "res-002",
            title: "Client Engagement Best Practices",
            type: "training",
            description: "Specialized training on how to engage with our organization's members effectively.",
            duration: "3 modules",
            tags: ["engagement", "communication", "clients"],
            link: "/dashboard/resource-library/training/client-engagement"
          },
          {
            id: "res-003",
            title: "Coaching Framework Overview",
            type: "video",
            description: "An introduction to our organization's preferred coaching methodology and framework.",
            duration: "25 min",
            tags: ["methodology", "framework", "coaching approach"],
            link: "/dashboard/resource-library/video/coaching-framework"
          },
          {
            id: "res-004",
            title: "Organization Member Personas",
            type: "document",
            description: "Detailed profiles of typical organization member roles and their coaching needs.",
            duration: "10 min read",
            tags: ["personas", "member profiles", "needs assessment"],
            link: "/dashboard/resource-library/document/member-personas",
            downloadable: true
          },
          {
            id: "res-005",
            title: "Growth Pathway Workshop",
            type: "training",
            description: "Interactive workshop on how to guide organization members through their professional growth.",
            duration: "4 modules",
            tags: ["workshop", "growth", "career development"],
            link: "/dashboard/resource-library/training/growth-pathway"
          },
          {
            id: "res-006",
            title: "Quarterly Coach Gathering Recap",
            type: "video",
            description: "Highlights and key takeaways from our most recent quarterly coach gathering.",
            duration: "35 min",
            tags: ["community", "networking", "events"],
            link: "/dashboard/resource-library/video/quarterly-gathering"
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
  const articles = resources.filter(r => r.type === "article" || r.type === "document")
  const videos = resources.filter(r => r.type === "video")
  const trainings = resources.filter(r => r.type === "training")

  const ResourceCard = ({ resource }: { resource: ResourceItem }) => {
    const TypeIcon = 
      resource.type === "article" || resource.type === "document" ? FileText : 
      resource.type === "video" ? Video : 
      Users
    
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
          {resource.downloadable && (
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
                <Download className="h-3 w-3" />
                Download
              </Button>
            </CardFooter>
          )}
        </Card>
      </Link>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <BookOpen className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">{organizationName} Coach Resources</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/coach/library">
            Browse Full Library <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="trainings">Trainings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6">
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
        
        <TabsContent value="trainings" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>About Coach Resources</CardTitle>
          <CardDescription>
            Exclusive materials for coaches partnered with {organizationName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            These resources have been specially created to help you work effectively with {organizationName} members. 
            They provide insights into our organization's structure, member needs, and preferred coaching approaches. 
            Use these materials to enhance your coaching sessions and deliver maximum value to our members.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 