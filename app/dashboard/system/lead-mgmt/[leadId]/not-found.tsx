import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function LeadNotFound() {
  return (
    <div className="container flex flex-col items-center justify-center h-[70vh] space-y-4">
      <h1 className="text-4xl font-bold">Lead Not Found</h1>
      <p className="text-muted-foreground text-center max-w-md">
        The lead you are looking for does not exist or you do not have permission to view it.
      </p>
      <Button asChild>
        <Link href="/dashboard/system/lead-mgmt" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Lead Management
        </Link>
      </Button>
    </div>
  )
} 