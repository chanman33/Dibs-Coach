import { CoachCard } from "./CoachCard"
import { mockCoaches } from "@/utils/mock/coaches-data"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function CoachList() {
  const coaches = mockCoaches

  if (!coaches?.length) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No coaches available at the moment.</p>
          <p className="mt-2">Try adjusting your search criteria or check back later.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold">All Coaches</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6">
          {coaches.map((coach) => (
            <CoachCard key={coach.ulid} coach={coach} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

