import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BaseCoachCardProps } from './types'
import React from 'react'

export function BaseCoachCard({
  name,
  imageUrl,
  specialty,
  bio,
  renderFooter,
}: BaseCoachCardProps) {
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={imageUrl} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{specialty}</p>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{bio}</p>
      </CardContent>

      {renderFooter && (
        <CardFooter>{renderFooter()}</CardFooter>
      )}
    </Card>
  )
}

export * from './types' 