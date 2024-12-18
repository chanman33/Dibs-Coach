import Link from 'next/link'
import { LockIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Unauthorized() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-foreground rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <LockIcon className="w-8 h-8 text-background" aria-hidden="true" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Unauthorized Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-lg text-muted-foreground">
            You don't have access to this page
          </p>
          <p className="text-sm text-muted-foreground">
            It looks like you haven't subscribed yet. To access this content, please upgrade to our premium service.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/">Upgrade Now</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

