import { Star, StarHalf } from 'lucide-react'

interface RatingDisplayProps {
  rating: number
  reviewCount?: number
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showNewCoachBadge?: boolean
}

const SIZES = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
}

export function RatingDisplay({ 
  rating, 
  reviewCount = 0, 
  showCount = true, 
  size = 'md',
  className = '',
  showNewCoachBadge = false
}: RatingDisplayProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
  const starSize = SIZES[size]
  const isNewCoach = reviewCount === 0 && showNewCoachBadge

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star 
            key={`full-${i}`} 
            className={`${starSize} fill-yellow-400 text-yellow-400`} 
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <StarHalf 
            className={`${starSize} fill-yellow-400 text-yellow-400`} 
          />
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star 
            key={`empty-${i}`} 
            className={`${starSize} text-muted-foreground/30`} 
          />
        ))}
      </div>

      {showCount && reviewCount > 0 && (
        <span className="text-sm text-muted-foreground">
          ({reviewCount})
        </span>
      )}

      {isNewCoach && (
        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
          New Coach
        </span>
      )}
    </div>
  )
} 