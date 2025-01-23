'use client'

import { MenteeGoalsDashboard } from './MenteeGoalsDashboard'

interface GoalsDashboardProps {
  userDbId: number
}

export function GoalsDashboard({ userDbId }: GoalsDashboardProps) {
  return <MenteeGoalsDashboard userDbId={userDbId} />
} 