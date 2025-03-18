"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, AlertCircle, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotAuthorizedPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message") || "You don't have permission to access this page"
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="mt-2 text-center">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
            <p className="font-medium">Possible reasons:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>You need to select or join an organization first</li>
              <li>Your organization role doesn't have the required permissions</li>
              <li>The requested feature requires additional access</li>
              <li>Your organization subscription doesn't include this feature</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full" variant="default">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
          
          <Button asChild className="w-full" variant="outline">
            <Link href="/dashboard/settings?tab=organizations">
              <Building2 className="mr-2 h-4 w-4" />
              Manage Organizations
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 