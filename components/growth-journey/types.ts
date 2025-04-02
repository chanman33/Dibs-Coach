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

export interface Achievement {
  id: string
  title: string
  date: string
  type: string
}

export interface GrowthJourneyData {
  currentGoals: Goal[]
  recentAchievements: Achievement[]
} 