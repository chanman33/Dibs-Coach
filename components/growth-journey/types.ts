export interface Milestone {
  title: string
  completed: boolean
}

export interface Goal {
  id: string
  title: string
  description: string
  type: string
  status: string
  progress: number
  target: number
  deadline: string
  milestones: Milestone[]
}

export interface CompletedGoal {
  id: string
  title: string
  completedAt: string | null
}

export interface GrowthJourneyData {
  currentGoals: Goal[]
  completedGoals: CompletedGoal[]
} 