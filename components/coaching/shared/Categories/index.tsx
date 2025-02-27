'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp,
  Building2,
  HeartHandshake,
  Award,
  Lightbulb,
  BarChart,
  Share2
} from 'lucide-react'
import { COACH_SPECIALTIES, SpecialtyCategory } from '@/utils/types/coach'
import { cn } from '@/lib/utils'
import { useState } from 'react'

// Define general categories to show
const GENERAL_CATEGORIES = [
  'BUSINESS_DEVELOPMENT',
  'BUSINESS_OPERATIONS',
  'CLIENT_RELATIONS',
  'PROFESSIONAL_DEVELOPMENT',
  'MARKET_INNOVATION',
  'ECONOMIC_MASTERY',
  'SOCIAL_MEDIA'
] as const;

type GeneralCategory = typeof GENERAL_CATEGORIES[number];

// Map category to icon
const categoryIcons: Record<GeneralCategory, any> = {
  BUSINESS_DEVELOPMENT: TrendingUp,
  BUSINESS_OPERATIONS: Building2,
  CLIENT_RELATIONS: HeartHandshake,
  PROFESSIONAL_DEVELOPMENT: Award,
  MARKET_INNOVATION: Lightbulb,
  ECONOMIC_MASTERY: BarChart,
  SOCIAL_MEDIA: Share2
}

// Map category to friendly display name and description
const categoryDetails: Record<GeneralCategory, { name: string; description: string }> = {
  BUSINESS_DEVELOPMENT: {
    name: 'Business Development',
    description: 'Grow your business through strategic initiatives'
  },
  BUSINESS_OPERATIONS: {
    name: 'Business Operations',
    description: 'Optimize your business processes'
  },
  CLIENT_RELATIONS: {
    name: 'Client Relations',
    description: 'Build stronger client relationships'
  },
  PROFESSIONAL_DEVELOPMENT: {
    name: 'Professional Development',
    description: 'Advance your career and skills'
  },
  MARKET_INNOVATION: {
    name: 'Market Innovation',
    description: 'Emerging trends and technologies'
  },
  ECONOMIC_MASTERY: {
    name: 'Economic Mastery',
    description: 'Economic analysis and strategy'
  },
  SOCIAL_MEDIA: {
    name: 'Social Media',
    description: 'Social media marketing and strategy'
  }
}

interface CategoriesProps {
  onCategoryClick?: (category: SpecialtyCategory, specialties: string[]) => void;
}

export function Categories({ onCategoryClick }: CategoriesProps) {
  const [selectedCategory, setSelectedCategory] = useState<SpecialtyCategory | null>(null);

  const handleCategoryClick = (category: SpecialtyCategory, specialties: string[]) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    onCategoryClick?.(category, specialties);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <h2 className="text-lg font-semibold">Skills</h2>
      </CardHeader>
      <CardContent className="grid gap-1.5">
        {GENERAL_CATEGORIES.map(category => {
          const Icon = categoryIcons[category]
          const details = categoryDetails[category]
          const specialties = COACH_SPECIALTIES[category as SpecialtyCategory]
          const isSelected = selectedCategory === category;

          return (
            <Button
              key={category}
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-md text-sm font-normal",
                "hover:bg-muted/50 transition-colors",
                isSelected && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleCategoryClick(category as SpecialtyCategory, [...specialties])}
            >
              <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{details.name}</span>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
} 