import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PublicCoach } from "@/utils/types/coach"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { StarIcon } from "lucide-react"

interface CoachCardProps {
  coach: PublicCoach
  featured?: boolean
}

export function CoachCard({ coach, featured }: CoachCardProps) {
  const displayName = coach.displayName || `${coach.firstName} ${coach.lastName}`
  const initials = coach.firstName?.[0] || 'C'

  return (
    <Card className="flex flex-col h-full relative">
      {featured && (
        <Badge className="absolute top-2 right-2" variant="secondary">
          Featured
        </Badge>
      )}
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={coach.profileImageUrl || ''} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{displayName}</CardTitle>
          {coach.coachingSpecialties?.[0] && (
            <CardDescription>{coach.coachingSpecialties[0]}</CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="line-clamp-3">{coach.bio}</p>

        <div className="mt-4 flex items-center gap-4">
          {coach.averageRating !== null && (
            <div className="flex items-center gap-1">
              <StarIcon className="h-4 w-4 text-yellow-400" />
              <span>{coach.averageRating.toFixed(1)}</span>
            </div>
          )}
          {coach.totalSessions > 0 && (
            <p className="text-sm text-gray-600">
              {coach.totalSessions} {coach.totalSessions === 1 ? "session" : "sessions"}
            </p>
          )}
          {coach.hourlyRate && (
            <p className="text-sm font-medium">
              ${coach.hourlyRate}/hr
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <Link href={`/coaches/${coach.ulid}`}>
          <Button>View Profile</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

