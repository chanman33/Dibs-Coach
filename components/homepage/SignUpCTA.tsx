import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/utils/cn"

interface SignUpCTAProps {
  className?: string
}

export function SignUpCTA({ className }: SignUpCTAProps) {
  return (
    <Card className={cn("bg-primary text-primary-foreground", className)}>
      <CardContent className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to Find Your Perfect Coach?</h2>
        <p className="mb-4">Sign up for free to book sessions and start your real estate journey today!</p>
        <Link href="/sign-up">
          <Button size="lg" variant="secondary">
            Sign Up Free
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

