'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plus, Trophy, Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Goal = {
  id: number;
  title: string;
  target: number;
  current: number;
  deadline: string;
  type: 'sales' | 'listings' | 'clients' | 'custom';
  status: 'in_progress' | 'completed' | 'overdue';
};

type Achievement = {
  id: number;
  title: string;
  description: string;
  earnedAt: string;
  type: 'milestone' | 'performance' | 'learning';
  icon: string;
};

// TODO: Move this to an API route once schema is updated
const mockData: { goals: Goal[]; achievements: Achievement[] } = {
  goals: [
    {
      id: 1,
      title: "Annual Sales Target",
      target: 5000000,
      current: 3200000,
      deadline: "2024-12-31",
      type: "sales",
      status: "in_progress"
    },
    {
      id: 2,
      title: "Active Listings",
      target: 10,
      current: 7,
      deadline: "2024-06-30",
      type: "listings",
      status: "in_progress"
    },
    {
      id: 3,
      title: "New Clients Q2",
      target: 15,
      current: 15,
      deadline: "2024-06-30",
      type: "clients",
      status: "completed"
    }
  ],
  achievements: [
    {
      id: 1,
      title: "Million Dollar Club",
      description: "Achieved $1M in sales",
      earnedAt: "2024-02-15",
      type: "milestone",
      icon: "trophy"
    },
    {
      id: 2,
      title: "Fast Closer",
      description: "Closed 3 deals in 30 days",
      earnedAt: "2024-03-01",
      type: "performance",
      icon: "trending-up"
    },
    {
      id: 3,
      title: "Learning Champion",
      description: "Completed 5 coaching sessions",
      earnedAt: "2024-03-10",
      type: "learning",
      icon: "check-circle"
    }
  ]
};

export function RealtorGoalsDashboard({ userDbId }: { userDbId: number }) {
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const fetchGoalsData = async () => {
      try {
        // TODO: Replace with actual API call once schema is updated
        // const response = await fetch(`${window.location.origin}/api/goals/${userDbId}`);
        // const data = await response.json();
        
        // Using mock data for now
        setGoals(mockData.goals);
        setAchievements(mockData.achievements);
      } catch (error) {
        console.error('Error fetching goals data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoalsData();
  }, [userDbId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Goals & Achievements</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Set New Goal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{goal.title}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="mt-2">
                <Progress 
                  value={(goal.current / goal.target) * 100} 
                  className="h-2"
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Progress: {((goal.current / goal.target) * 100).toFixed(0)}%</span>
                <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
              </div>
              <div className="mt-2">
                <span className={clsx(
                  "text-xs px-2 py-1 rounded-full",
                  {
                    "bg-green-100 text-green-800": goal.status === "completed",
                    "bg-yellow-100 text-yellow-800": goal.status === "in_progress",
                    "bg-red-100 text-red-800": goal.status === "overdue"
                  }
                )}>
                  {goal.status.replace('_', ' ')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="text-2xl font-semibold tracking-tight mt-8 mb-4">Recent Achievements</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <Card key={achievement.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{achievement.title}</CardTitle>
              {achievement.icon === 'trophy' && <Trophy className="h-4 w-4 text-yellow-500" />}
              {achievement.icon === 'trending-up' && <TrendingUp className="h-4 w-4 text-blue-500" />}
              {achievement.icon === 'check-circle' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 