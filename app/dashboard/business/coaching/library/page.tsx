"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  BookOpen, 
  Construction,
  CalendarClock,
  Bell,
  Check
} from "lucide-react"
import { addToFeatureWaitlist } from "@/utils/actions/feature-waitlist-actions"
import { useOrganization } from "@/hooks/use-organization"

export default function BusinessLibraryPage() {
  const [activeTab, setActiveTab] = useState("browse")
  
  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Library Management</h1>
          <p className="text-muted-foreground">
            Curate learning content for your team and track their progress.
          </p>
        </div>

        <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Content</TabsTrigger>
            <TabsTrigger value="manage">Manage Content</TabsTrigger>
            <TabsTrigger value="progress">Team Progress</TabsTrigger>
          </TabsList>
          
          {/* All tabs now display coming soon placeholder */}
          <TabsContent value="browse" className="space-y-4">
            <ComingSoonPlaceholder 
              title="Content Library"
              description="Browse and assign training resources to your team"
              icon={BookOpen}
              featureId="content-library"
            />
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-6">
            <ComingSoonPlaceholder 
              title="Content Management"
              description="Create and manage custom training content for your organization"
              icon={Construction}
              featureId="content-management"
            />
          </TabsContent>
          
          <TabsContent value="progress" className="space-y-6">
            <ComingSoonPlaceholder 
              title="Team Progress Tracking"
              description="Monitor your team's learning progress and engagement"
              icon={CalendarClock}
              featureId="team-progress"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Coming soon placeholder component
function ComingSoonPlaceholder({ 
  title, 
  description, 
  icon: Icon,
  featureId
}: { 
  title: string
  description: string
  icon: React.ElementType
  featureId: string
}) {
  const [email, setEmail] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const { organization, loading, error } = useOrganization()
  
  // Log organization info for debugging
  useEffect(() => {
    console.log("[ORGANIZATION_CONTEXT]", {
      loading,
      error: error?.message,
      organization: organization ? {
        id: organization.id,
        name: organization.name,
        type: organization.type,
        level: organization.level
      } : null
    })
  }, [organization, loading, error])

  const handleNotifyClick = () => {
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Log the organization ID being sent
      console.log("[SUBMITTING_WAITLIST]", { 
        email, 
        featureId, 
        organizationId: organization?.id
      })
      
      // Use the server action to add to waitlist
      const result = await addToFeatureWaitlist({
        email,
        featureId,
        organizationId: organization?.id
      })
      
      if (!result.success) {
        throw new Error(result.error || "Failed to add to waitlist")
      }
      
      toast.success("You'll be notified when this feature becomes available!")
      setIsSubscribed(true)
      setShowForm(false)
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error("[FEATURE_WAITLIST_ERROR]", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full flex flex-col items-center justify-center py-16 text-center">
      <CardHeader>
        <div className="mx-auto bg-muted rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Coming Soon</CardTitle>
      </CardHeader>
      <CardContent className="max-w-md">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        <p className="text-sm text-muted-foreground">
          This feature is currently in development and will be available in a future update. Join our waitlist to be among the first to try <strong>{title}</strong> when it launches.
        </p>
        
        {isSubscribed ? (
          <div className="mt-6 flex flex-col items-center">
            <div className="bg-primary/10 text-primary rounded-full p-2 mb-2">
              <Check className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">You're on the waitlist for <strong>{title}</strong>!</p>
            <p className="text-xs text-muted-foreground mt-1">We'll notify you as soon as this feature becomes available.</p>
          </div>
        ) : !showForm ? (
          <Button 
            className="mt-6" 
            variant="outline"
            onClick={handleNotifyClick}
          >
            <Bell className="mr-2 h-4 w-4" />
            Notify Me
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
