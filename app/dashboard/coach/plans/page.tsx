"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Target, ListChecks, CalendarRange, Clock } from "lucide-react"
import { ComingSoon } from "@/components/profile/common/ComingSoon"
import { ProfileProvider } from "@/components/profile/context/ProfileContext";

function PlansPageContent() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Your Plans</h1>
      
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-primary" />
                Development Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComingSoon 
                title="Development Plans"
                description="Create structured plans to achieve your goals. Link specific actions to your goals and track your progress over time."
                showImage={false}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Habit Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComingSoon 
                title="Habit Tracker"
                description="Build consistency with daily habit tracking. Turn your plans into sustainable habits that lead to long-term success."
                showImage={false}
              />
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarRange className="mr-2 h-5 w-5 text-primary" />
              Plan Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComingSoon 
              title="Plan Calendar"
              description="Visualize your plans and goals on a calendar. Schedule actions, set deadlines, and never miss an important milestone."
              showImage={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CoachPlansPage() {
  return (
    <ProfileProvider>
      <PlansPageContent />
    </ProfileProvider>
  );
} 