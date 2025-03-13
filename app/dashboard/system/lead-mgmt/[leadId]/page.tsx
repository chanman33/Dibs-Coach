import { notFound } from "next/navigation"
import { getLead } from "@/utils/actions/lead-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeadDetailsForm } from "./_components/lead-details-form"
import { LeadInteractionHistory } from "./_components/lead-interaction-history"
import { LeadInteractionForm } from "./_components/lead-interaction-form"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function LeadDetailPage({ 
  params,
  searchParams
}: { 
  params: { leadId: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { data: lead, error } = await getLead(params.leadId)
  
  if (error || !lead) {
    notFound()
  }
  
  // Get the active tab from the query parameters or default to "details"
  const activeTab = searchParams.tab as string || "details"
  
  return (
    <div className="container space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Link 
          href="/dashboard/system/lead-mgmt" 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Leads
        </Link>
      </div>
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{lead.companyName}</h1>
      </div>
      
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="details">Lead Details</TabsTrigger>
          <TabsTrigger value="interactions">Interaction History</TabsTrigger>
          <TabsTrigger value="new-interaction">New Interaction</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadDetailsForm lead={lead} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="interactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Interaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadInteractionHistory lead={lead} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="new-interaction" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Interaction</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadInteractionForm leadId={lead.ulid} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 