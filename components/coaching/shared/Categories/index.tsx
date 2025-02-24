'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Briefcase, 
  GraduationCap, 
  LineChart, 
  Users, 
  Building2, 
  Target 
} from 'lucide-react'

const categories = [
  {
    name: 'Career Development',
    icon: Briefcase,
    description: 'Advance your career path'
  },
  {
    name: 'Leadership',
    icon: Users,
    description: 'Develop leadership skills'
  },
  {
    name: 'Business Strategy',
    icon: Building2,
    description: 'Grow your business'
  },
  {
    name: 'Performance',
    icon: LineChart,
    description: 'Improve your performance'
  },
  {
    name: 'Education',
    icon: GraduationCap,
    description: 'Learn and grow'
  },
  {
    name: 'Goal Setting',
    icon: Target,
    description: 'Achieve your goals'
  }
]

interface CategoriesProps {
  onCategoryClick?: (category: string) => void;
}

export function Categories({ onCategoryClick }: CategoriesProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Categories</h2>
      </CardHeader>
      <CardContent className="grid gap-2">
        {categories.map(category => {
          const Icon = category.icon
          return (
            <Button
              key={category.name}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onCategoryClick?.(category.name)}
            >
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col items-start">
                <span>{category.name}</span>
                <span className="text-xs text-muted-foreground">
                  {category.description}
                </span>
              </div>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
} 