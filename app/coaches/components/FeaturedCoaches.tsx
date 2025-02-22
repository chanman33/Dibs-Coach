import { CoachCard } from "./CoachCard"
import { mockFeaturedCoaches } from "@/utils/mock/coaches-data"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function FeaturedCoaches() {
  const featuredCoaches = mockFeaturedCoaches

  if (!featuredCoaches?.length) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Coaches</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredCoaches.map((coach) => (
            <CoachCard key={coach.ulid} coach={coach} featured={true} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

