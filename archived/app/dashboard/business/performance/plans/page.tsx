"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarRange, 
  Clock, 
  Filter, 
  Plus, 
  Search, 
  Target, 
  User,
  ListChecks,
  FileText
} from "lucide-react";
import { ComingSoon } from "@/components/profile/common/ComingSoon";

// Placeholder component for the plans table
function PlansTable() {
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle>Development Plans</CardTitle>
        <CardDescription>View and manage employee development plans</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search plans..."
                className="w-full bg-background pl-8"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </div>
        
        <ComingSoon 
          title="Development Plans Feature"
          description="The ability to create and manage employee development plans is coming soon. This feature will allow managers to help employees develop skills and achieve their goals."
        />
      </CardContent>
    </Card>
  );
}

// Placeholder component for plans stats
function PlansOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--</div>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--</div>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--</div>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Completion Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--%</div>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BusinessPlansPage() {
  const [activeTab, setActiveTab] = useState("all");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Development Plans</h1>
        <div className="flex items-center gap-2">
          <Select defaultValue="current">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Period</SelectItem>
              <SelectItem value="previous">Previous Period</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team Plans</TabsTrigger>
          <TabsTrigger value="individual">Individual Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <PlansOverview />
          <PlansTable />
        </TabsContent>
        
        <TabsContent value="team" className="space-y-4">
          <ComingSoon 
            title="Team Development Plans"
            description="This section will allow you to create and manage development plans for entire teams or departments. Check back soon for this feature!"
          />
        </TabsContent>
        
        <TabsContent value="individual" className="space-y-4">
          <ComingSoon 
            title="Individual Development Plans"
            description="Individual employee development plans will be available here. This will help managers track each employee's growth and skill development."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
