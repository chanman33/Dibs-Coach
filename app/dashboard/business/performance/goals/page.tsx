"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  RotateCcw,
  ChevronRight,
  CalendarRange,
  Clock,
  Target,
  User
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { GOAL_STATUS, GOAL_TYPE, GoalStatus } from "@/utils/types/goal";
import { fetchOrganizationGoals, createOrganizationGoal, updateOrganizationGoal } from "@/utils/actions/goals";
import { fetchOrganizationMembers } from "@/utils/actions/organization-members";
import { cn } from "@/lib/utils";
import { useAuth } from "@/utils/hooks/useAuth";
import { RouteGuardProvider } from "@/components/auth/RouteGuardContext";
import { ContainerLoading } from "@/components/loading";
import React from "react";
import GoalFormDialog from "@/app/dashboard/business/performance/goals/components/GoalFormDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Goal Progress Chart Component
function GoalProgressChart({ data }: { data: { name: string; value: number; }[] }) {
  if (!data || !data.length || data.every(item => item.value === 0)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="flex h-full w-full flex-col justify-center space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <div className="text-sm font-medium">{item.name}</div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-primary" 
                  style={{ 
                    width: `${item.value > 0 ? Math.max((item.value / Math.max(...data.map(d => d.value))) * 100, 5) : 0}%` 
                  }}
                />
              </div>
            </div>
            <div className="w-10 text-right text-sm tabular-nums text-muted-foreground">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Types based on the schema
type Goal = {
  ulid: string;
  userUlid: string;
  organizationUlid?: string;
  type: string;
  status: string;
  title: string;
  description?: string;
  target?: any;
  progress?: any;
  startDate: Date;
  dueDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
};

type GoalFormData = {
  title: string;
  description: string;
  type: string;
  target: string;
  startDate: Date;
  dueDate: Date;
  assignTo: string; // 'organization' or 'individual'
  userUlid?: string;
};

// Create a new GoalDetailsDialog component
function GoalDetailsDialog({ 
  showDetailsDialog, 
  setShowDetailsDialog, 
  selectedGoal,
  updateGoalStatus,
  formatGoalType,
  calculateProgress,
  getStatusBadgeColor
}: {
  showDetailsDialog: boolean;
  setShowDetailsDialog: (show: boolean) => void;
  selectedGoal: Goal | null;
  updateGoalStatus: (goalId: string, newStatus: string) => Promise<void>;
  formatGoalType: (type: string) => string;
  calculateProgress: (goal: Goal) => number;
  getStatusBadgeColor: (status: string) => string;
}) {
  if (!selectedGoal) return null;

  const getProgressColor = (status: string) => {
    switch (status) {
      case GOAL_STATUS.COMPLETED:
        return "[&>div]:bg-green-500";
      case GOAL_STATUS.OVERDUE:
        return "[&>div]:bg-red-500";
      default:
        return "[&>div]:bg-blue-500";
    }
  };

  const progressPercentage = calculateProgress(selectedGoal);
  const progressColor = getProgressColor(selectedGoal.status);
  const daysRemaining = selectedGoal.status !== GOAL_STATUS.COMPLETED
    ? Math.ceil((new Date(selectedGoal.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header with status badge */}
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">{selectedGoal.title}</DialogTitle>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Description */}
            {selectedGoal.description && (
              <div className="bg-muted/20 p-4 rounded-lg">
                <p className="text-muted-foreground">{selectedGoal.description}</p>
              </div>
            )}

            {/* Progress section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Progress</h3>
                </div>
                <Badge className={cn(getStatusBadgeColor(selectedGoal.status), "px-3 py-1")}>
                  {selectedGoal.status === GOAL_STATUS.IN_PROGRESS
                    ? "In Progress"
                    : selectedGoal.status === GOAL_STATUS.COMPLETED
                      ? "Completed"
                      : "Overdue"}
                </Badge>
              </div>
              <div className="bg-muted/10 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{progressPercentage}%</span>
                  {selectedGoal.target && selectedGoal.progress && (
                    <span className="text-sm text-muted-foreground">
                      {selectedGoal.progress.value || 0} / {selectedGoal.target.value || 0}
                      {selectedGoal.target.unit && ` ${selectedGoal.target.unit}`}
                    </span>
                  )}
                </div>
                <Progress
                  value={progressPercentage}
                  className={cn("w-full h-2.5 bg-muted", progressColor)}
                />
                {selectedGoal.status === GOAL_STATUS.IN_PROGRESS && daysRemaining > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                {/* Type */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span>Type</span>
                  </h3>
                  <Badge variant="secondary" className="px-3 py-1">
                    {formatGoalType(selectedGoal.type)}
                  </Badge>
                </div>

                {/* Assigned To */}
                {selectedGoal.user && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Assigned To</span>
                    </h3>
                    <div className="bg-muted/10 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {`${selectedGoal.user.firstName?.charAt(0) || ""}${selectedGoal.user.lastName?.charAt(0) || ""}`}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {selectedGoal.user.firstName} {selectedGoal.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{selectedGoal.user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Timeline */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CalendarRange className="h-4 w-4" />
                    <span>Timeline</span>
                  </h3>
                  <div className="bg-muted/10 p-3 rounded-lg">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Start Date</span>
                        <span className="text-sm">{format(new Date(selectedGoal.startDate), "MMM d, yyyy")}</span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Due Date</span>
                        <span className="text-sm">{format(new Date(selectedGoal.dueDate), "MMM d, yyyy")}</span>
                      </div>
                      {selectedGoal.completedAt && (
                        <>
                          <Separator className="my-1" />
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Completed
                            </span>
                            <span className="text-sm">{format(new Date(selectedGoal.completedAt), "MMM d, yyyy")}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Created & Updated */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Metadata</h3>
                  <div className="bg-muted/10 p-3 rounded-lg">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Created</span>
                        <span className="text-sm">{format(new Date(selectedGoal.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Last Updated</span>
                        <span className="text-sm">{format(new Date(selectedGoal.updatedAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BusinessGoalsPage() {
  const { toast } = useToast();
  const { userUlid, isLoading: authLoading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [organizationUlid, setOrganizationUlid] = useState<string | null>(null);

  // Simplified dialog open/close
  const openAddGoalDialog = useCallback(() => {
    setShowAddGoalDialog(true);
  }, []);
  
  const closeAddGoalDialog = useCallback(() => {
    setShowAddGoalDialog(false);
  }, []);

  // Fetch organization data from context
  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      try {
        const response = await fetch('/api/user/organizations');
        if (response.ok) {
          const data = await response.json();
          if (data.organizations?.length > 0) {
            setOrganizationUlid(data.organizations[0].organizationUlid);
          }
        }
      } catch (error) {
        console.error('[FETCH_ORG_ERROR]', error);
      }
    };
    
    fetchOrganizationInfo();
  }, []);

  // Fetch org goals
  useEffect(() => {
    if (organizationUlid) {
      loadGoals();
    }
  }, [organizationUlid]);

  // Memoize members loading to prevent redundant fetches
  const loadOrganizationMembers = useCallback(async () => {
    if (!organizationUlid) return;
    
    try {
      const { data, error } = await fetchOrganizationMembers(organizationUlid);
      if (error) {
        throw new Error(error.message);
      }
      console.log('[FETCHED_MEMBERS]', data);
      setMembers(data || []);
    } catch (error) {
      console.error('[FETCH_MEMBERS_ERROR]', error);
      toast({
        title: "Error fetching members",
        description: error instanceof Error ? error.message : "Failed to fetch organization members",
        variant: "destructive",
      });
    }
  }, [organizationUlid, toast]);

  // Load members only once when dialog opens
  useEffect(() => {
    if (!showAddGoalDialog) return;
    
    if (organizationUlid && members.length === 0) {
      loadOrganizationMembers();
    }
  }, [showAddGoalDialog, organizationUlid, members.length, loadOrganizationMembers]);

  const loadGoals = async () => {
    if (!organizationUlid) return;
    
    setLoading(true);
    try {
      const { data, error } = await fetchOrganizationGoals(organizationUlid);
      if (error) {
        throw new Error(error.message);
      }
      const typedGoals = (data || []).map(goal => {
        const base = { ...goal };
        return {
          ...base,
          startDate: new Date(base.startDate),
          dueDate: new Date(base.dueDate),
          completedAt: base.completedAt ? new Date(base.completedAt) : undefined
        };
      }) as Goal[];
      setGoals(typedGoals);
      setFilteredGoals(typedGoals);
    } catch (error: any) {
      toast({
        title: "Error fetching goals",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    if (!goals.length) return;

    let filtered = [...goals];

    // Filter by tab
    if (activeTab === "company") {
      filtered = filtered.filter(goal => goal.organizationUlid);
    } else if (activeTab === "individual") {
      filtered = filtered.filter(goal => !goal.organizationUlid);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(goal => goal.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        goal => goal.title.toLowerCase().includes(query) || 
                (goal.description && goal.description.toLowerCase().includes(query))
      );
    }

    setFilteredGoals(filtered);
  }, [goals, activeTab, filterStatus, searchQuery]);

  // Handle goal creation success
  const handleGoalCreated = useCallback(async () => {
    closeAddGoalDialog();
    await loadGoals();
  }, [closeAddGoalDialog, loadGoals]);

  const updateGoalStatus = async (goalId: string, newStatus: string) => {
    try {
      const { data, error } = await updateOrganizationGoal({
        goalUlid: goalId, 
        data: { 
          status: newStatus,
          completedAt: newStatus === GOAL_STATUS.COMPLETED ? new Date() : undefined
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Goal updated",
        description: `Goal status changed to ${newStatus}`,
      });

      await loadGoals();
    } catch (error: any) {
      toast({
        title: "Error updating goal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case GOAL_STATUS.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case GOAL_STATUS.COMPLETED:
        return "bg-green-100 text-green-800";
      case GOAL_STATUS.OVERDUE:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateProgress = (goal: Goal) => {
    if (!goal.target || !goal.progress) return 0;
    
    const targetValue = goal.target.value || 0;
    const progressValue = goal.progress.value || 0;
    
    if (targetValue === 0) return 0;
    return Math.min(Math.round((progressValue / targetValue) * 100), 100);
  };

  // Group goals by status for dashboard charts
  const getGoalsByStatus = () => {
    const counts: Record<GoalStatus, number> = {
      [GOAL_STATUS.IN_PROGRESS]: 0,
      [GOAL_STATUS.COMPLETED]: 0,
      [GOAL_STATUS.OVERDUE]: 0,
    };
    
    goals.forEach(goal => {
      const status = goal.status as GoalStatus;
      if (Object.values(GOAL_STATUS).includes(status)) {
        counts[status]++;
      }
    });
    
    return [
      { name: 'In Progress', value: counts[GOAL_STATUS.IN_PROGRESS] },
      { name: 'Completed', value: counts[GOAL_STATUS.COMPLETED] },
      { name: 'Overdue', value: counts[GOAL_STATUS.OVERDUE] },
    ];
  };

  // Format goal types for display
  const formatGoalType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (authLoading || (loading && !goals.length)) {
    return (
      <RouteGuardProvider required="business-dashboard">
        <div className="flex-1 p-6">
          <ContainerLoading message="Loading goals..." />
        </div>
      </RouteGuardProvider>
    );
  }

  return (
    <RouteGuardProvider required="business-dashboard">
      <div className="flex flex-col space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Goals</h1>
            <p className="text-muted-foreground">
              Track and manage goals for your organization, teams, and individuals.
            </p>
          </div>
          <Button onClick={openAddGoalDialog}>
            <Plus className="mr-2 h-4 w-4" /> Create Goal
          </Button>
        </div>

        {/* Dashboard Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{goals.length}</div>
              <div className="text-sm text-muted-foreground mt-2">
                {goals.filter(g => g.status === GOAL_STATUS.COMPLETED).length} completed
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Goal Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {goals.length 
                  ? Math.round((goals.filter(g => g.status === GOAL_STATUS.COMPLETED).length / goals.length) * 100)
                  : 0}%
              </div>
              <Progress 
                className="mt-2" 
                value={goals.length 
                  ? (goals.filter(g => g.status === GOAL_STATUS.COMPLETED).length / goals.length) * 100
                  : 0} 
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Goal Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[150px]">
              <GoalProgressChart data={getGoalsByStatus()} />
            </CardContent>
          </Card>
        </div>

        {/* Goals Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="company">Company Goals</TabsTrigger>
              <TabsTrigger value="individual">Individual Goals</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={GOAL_STATUS.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={GOAL_STATUS.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={GOAL_STATUS.OVERDUE}>Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Input
                className="w-[200px]"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="company" className="mt-0">
            <GoalsTable 
              goals={filteredGoals} 
              loading={loading} 
              calculateProgress={calculateProgress}
              getStatusBadgeColor={getStatusBadgeColor}
              formatGoalType={formatGoalType}
              updateGoalStatus={updateGoalStatus}
            />
          </TabsContent>
          
          <TabsContent value="individual" className="mt-0">
            <GoalsTable 
              goals={filteredGoals} 
              loading={loading} 
              calculateProgress={calculateProgress}
              getStatusBadgeColor={getStatusBadgeColor}
              formatGoalType={formatGoalType}
              updateGoalStatus={updateGoalStatus}
              isIndividualView={true}
            />
          </TabsContent>
        </Tabs>

        {/* Use the new separate goal form component */}
        {showAddGoalDialog && (
          <GoalFormDialog
            isOpen={showAddGoalDialog} 
            onClose={closeAddGoalDialog}
            onSuccess={handleGoalCreated}
            members={members}
            organizationUlid={organizationUlid}
            formatGoalType={formatGoalType}
          />
        )}
      </div>
    </RouteGuardProvider>
  );
}

// Goals Table Component
function GoalsTable({ 
  goals, 
  loading, 
  calculateProgress, 
  getStatusBadgeColor,
  formatGoalType,
  updateGoalStatus,
  isIndividualView = false
}: {
  goals: Goal[];
  loading: boolean;
  calculateProgress: (goal: Goal) => number;
  getStatusBadgeColor: (status: string) => string;
  formatGoalType: (type: string) => string;
  updateGoalStatus: (goalId: string, newStatus: string) => Promise<void>;
  isIndividualView?: boolean;
}) {
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Group goals by user
  const goalsByUser = useMemo(() => {
    if (!isIndividualView) return {};
    
    return goals.reduce((acc, goal) => {
      if (!goal.userUlid) return acc;
      
      if (!acc[goal.userUlid]) {
        acc[goal.userUlid] = {
          userInfo: goal.user || { firstName: 'Unknown', lastName: 'User', email: '' },
          goals: []
        };
      }
      
      acc[goal.userUlid].goals.push(goal);
      return acc;
    }, {} as Record<string, { userInfo: any, goals: Goal[] }>);
  }, [goals, isIndividualView]);
  
  const toggleUserExpanded = (userUlid: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userUlid]: !prev[userUlid]
    }));
  };
  
  if (loading) {
    return <ContainerLoading message="Loading goals..." />;
  }

  if (!goals.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="mb-4 text-muted-foreground">No goals found</p>
        <p className="text-sm text-muted-foreground">
          Create a new goal to start tracking performance.
        </p>
      </div>
    );
  }
  
  // For company goals or when not in individual view, show the regular table
  if (!isIndividualView) {
    return (
      <>
        <Card className="w-full shadow-sm">
          <CardHeader className="px-6 py-4 bg-muted/30">
            <div className="grid grid-cols-12 gap-4 font-medium">
              <div className="col-span-3">Title</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-3">Progress</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Actions</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {goals.map((goal) => (
                <div key={goal.ulid} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                  <div className="col-span-3 pr-4">
                    <div className="font-medium truncate">{goal.title}</div>
                    {goal.description && (
                      <div className="text-sm text-muted-foreground/80 line-clamp-1 mt-0.5">{goal.description}</div>
                    )}
                    {goal.user && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{goal.user?.firstName} {goal.user?.lastName}</span>
                        <Plus className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Badge variant="outline" className="text-xs font-normal px-2.5 py-0.5">
                      {formatGoalType(goal.type)}
                    </Badge>
                  </div>
                  <div className="col-span-3 px-2">
                    <div className="flex flex-col gap-1.5">
                      {goal.target && goal.progress && (
                        <div className="text-[11px] text-muted-foreground/80 tabular-nums">
                          {goal.progress.value || 0} / {goal.target.value || 0}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Progress 
                            value={calculateProgress(goal)} 
                            className={cn(
                              "h-2",
                              goal.status === GOAL_STATUS.COMPLETED
                                ? "bg-green-100 dark:bg-green-900/30"
                                : goal.status === GOAL_STATUS.OVERDUE
                                  ? "bg-red-100 dark:bg-red-900/30"
                                  : "bg-blue-100 dark:bg-blue-900/30",
                            )}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
                          {calculateProgress(goal)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(goal.dueDate), "MMM d, yyyy")}
                  </div>
                  <div className="col-span-2">
                    <Badge className={cn(
                      getStatusBadgeColor(goal.status),
                      "text-xs whitespace-nowrap font-normal px-2.5 py-0.5"
                    )}>
                      {goal.status === GOAL_STATUS.IN_PROGRESS ? "In Progress" : 
                       goal.status === GOAL_STATUS.COMPLETED ? "Completed" : "Overdue"}
                    </Badge>
                  </div>
                  <div className="col-span-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7 p-0 hover:bg-muted/50 rounded-full"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]" alignOffset={-5}>
                        <DropdownMenuItem 
                          onSelect={() => {
                            setSelectedGoal(goal);
                            setShowDetailsDialog(true);
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {/* Only show status management for company goals */}
                        {goal.organizationUlid && (
                          goal.status !== GOAL_STATUS.COMPLETED ? (
                            <DropdownMenuItem 
                              onSelect={() => updateGoalStatus(goal.ulid, GOAL_STATUS.COMPLETED)}
                              className="gap-2 cursor-pointer"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onSelect={() => updateGoalStatus(goal.ulid, GOAL_STATUS.IN_PROGRESS)}
                              className="gap-2 cursor-pointer"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Reopen
                            </DropdownMenuItem>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Use the new Goal Details Dialog */}
        <GoalDetailsDialog 
          showDetailsDialog={showDetailsDialog} 
          setShowDetailsDialog={setShowDetailsDialog} 
          selectedGoal={selectedGoal}
          updateGoalStatus={updateGoalStatus}
          formatGoalType={formatGoalType}
          calculateProgress={calculateProgress}
          getStatusBadgeColor={getStatusBadgeColor}
        />
      </>
    );
  }
  
  // For individual view, group by user with expandable sections
  return (
    <>
      <Card className="w-full shadow-sm">
        <CardHeader className="px-6 py-4 bg-muted/30">
          <div className="grid grid-cols-12 gap-4 font-medium">
            <div className="col-span-4">Team Member</div>
            <div className="col-span-2 text-center">Total Goals</div>
            <div className="col-span-2 text-center">Completed</div>
            <div className="col-span-2 text-center">In Progress</div>
            <div className="col-span-2 text-center">Overdue</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {Object.entries(goalsByUser).map(([userUlid, { userInfo, goals }]) => (
              <div key={userUlid} className="flex flex-col">
                <div
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => toggleUserExpanded(userUlid)}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <Plus
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        expandedUsers[userUlid] ? "rotate-90" : ""
                      }`}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {`${userInfo.firstName?.charAt(0) || ''}${userInfo.lastName?.charAt(0) || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {userInfo.firstName} {userInfo.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{userInfo.email}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-medium">{goals.length}</div>
                  <div className={`col-span-2 text-center font-medium text-green-600 dark:text-green-400`}>
                    {goals.filter(g => g.status === GOAL_STATUS.COMPLETED).length}
                  </div>
                  <div className={`col-span-2 text-center font-medium text-blue-600 dark:text-blue-400`}>
                    {goals.filter(g => g.status === GOAL_STATUS.IN_PROGRESS).length}
                  </div>
                  <div className={`col-span-2 text-center font-medium text-red-600 dark:text-red-400`}>
                    {goals.filter(g => g.status === GOAL_STATUS.OVERDUE).length}
                  </div>
                </div>

                {expandedUsers[userUlid] && (
                  <div className="bg-muted/10 px-6 py-4 border-t">
                    {goals.length > 0 ? (
                      <div className="divide-y divide-muted/40">
                        <div className="grid grid-cols-12 gap-4 pb-3 font-medium text-sm text-muted-foreground">
                          <div className="col-span-3">Title</div>
                          <div className="col-span-2">Status</div>
                          <div className="col-span-2">Type</div>
                          <div className="col-span-2">Progress</div>
                          <div className="col-span-2">Due Date</div>
                          <div className="col-span-1 text-right">Actions</div>
                        </div>
                        {goals.map((goal) => (
                          <div
                            key={goal.ulid}
                            className="grid grid-cols-12 gap-4 py-3 items-center text-sm hover:bg-muted/20 rounded-md transition-colors"
                          >
                            <div className="col-span-3 pr-4">
                              <div className="font-medium truncate">{goal.title}</div>
                              {goal.description && (
                                <div className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5">
                                  {goal.description}
                                </div>
                              )}
                            </div>
                            <div className="col-span-2">
                              <Badge
                                className={cn(
                                  getStatusBadgeColor(goal.status),
                                  "text-xs whitespace-nowrap font-normal px-2.5 py-0.5",
                                )}
                              >
                                {goal.status === GOAL_STATUS.IN_PROGRESS
                                  ? "In Progress"
                                  : goal.status === GOAL_STATUS.COMPLETED
                                    ? "Completed"
                                    : "Overdue"}
                              </Badge>
                            </div>
                            <div className="col-span-2">
                              <Badge variant="outline" className="text-xs font-normal px-2.5 py-0.5">
                                {formatGoalType(goal.type)}
                              </Badge>
                            </div>
                            <div className="col-span-2">
                              <div className="flex flex-col gap-1.5 px-2">
                                {goal.target && goal.progress && (
                                  <div className="text-[11px] text-muted-foreground/80 tabular-nums">
                                    {goal.progress.value || 0} / {goal.target.value || 0}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <Progress 
                                      value={calculateProgress(goal)} 
                                      className={cn(
                                        "h-2",
                                        goal.status === GOAL_STATUS.COMPLETED
                                          ? "bg-green-100 dark:bg-green-900/30"
                                          : goal.status === GOAL_STATUS.OVERDUE
                                            ? "bg-red-100 dark:bg-red-900/30"
                                            : "bg-blue-100 dark:bg-blue-900/30",
                                      )}
                                    />
                                  </div>
                                  <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
                                    {calculateProgress(goal)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2 text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(goal.dueDate), "MMM d, yyyy")}
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 p-0 hover:bg-muted/50 rounded-full"
                                  >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]" alignOffset={-5}>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setSelectedGoal(goal);
                                      setShowDetailsDialog(true);
                                    }}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-muted-foreground">No goals found for this user</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goal Details Dialog (using the new component) */}
      <GoalDetailsDialog
        showDetailsDialog={showDetailsDialog}
        setShowDetailsDialog={setShowDetailsDialog}
        selectedGoal={selectedGoal}
        updateGoalStatus={updateGoalStatus}
        formatGoalType={formatGoalType}
        calculateProgress={calculateProgress}
        getStatusBadgeColor={getStatusBadgeColor}
      />
    </>
  );
}
