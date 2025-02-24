'use client'

import { CoachesHero } from '@/components/coaching/public/CoachesHero'
import { BrowseCoaches } from '@/components/coaching/public/BrowseCoaches'

export default function CoachesPage() {
  return (
    <div className="bg-background">
      <CoachesHero />
      <BrowseCoaches showFeatured={true} />
    </div>
  )
}

