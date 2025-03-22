"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormLabel as UFormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type SubmitHandler } from "react-hook-form"
import * as z from "zod"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Pencil, X, Loader2, Target, Clock, TrendingUp, Trophy, Home, DollarSign, Users, Star, Globe, Award, BookOpen, Settings } from "lucide-react"
import { fetchGoals, deleteGoal as deleteGoalAction, updateOrganizationGoal } from "@/utils/actions/goals"
import { toast } from "sonner"
import { 
  GOAL_STATUS, 
  GOAL_TYPE, 
  GOAL_FORMAT, 
  type GoalStatus, 
  type GoalType, 
  type GoalFormat, 
  type GoalFormValues,
  type ClientGoal
} from "@/utils/types/goals"
import { type ValidationError } from "@/utils/types/errors"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Validation schema
const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  target: z.number({
    required_error: "Target value is required",
    invalid_type_error: "Target must be a number"
  }).min(0, "Target must be a positive number"),
  current: z.number({
    required_error: "Current value is required",
    invalid_type_error: "Current value must be a number"
  }).min(0, "Current value must be a positive number"),
  deadline: z.string().min(1, "Deadline is required"),
  type: z.enum(Object.values(GOAL_TYPE) as [string, ...string[]]),
  status: z.enum(Object.values(GOAL_STATUS) as [string, ...string[]]).default(GOAL_STATUS.IN_PROGRESS),
})

// Database types following .cursorrules conventions

interface GoalsFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormValues) => Promise<void>;
}

const getGoalTypeIcon = (type: string) => {
  switch (type) {
    // Financial Goals
    case 'sales_volume':
    case 'commission_income':
    case 'gci':
    case 'session_revenue':
      return <DollarSign className="h-4 w-4" />
    case 'avg_sale_price':
      return <TrendingUp className="h-4 w-4" />
    
    // Transaction Goals
    case 'listings':
    case 'buyer_transactions':
    case 'closed_deals':
      return <Home className="h-4 w-4" />
    case 'days_on_market':
      return <Clock className="h-4 w-4" />
    
    // Client Goals
    case 'new_clients':
    case 'referrals':
    case 'client_retention':
      return <Users className="h-4 w-4" />
    case 'reviews':
      return <Star className="h-4 w-4" />
    
    // Market Presence
    case 'market_share':
    case 'territory_expansion':
      return <Globe className="h-4 w-4" />
    case 'social_media':
    case 'website_traffic':
      return <TrendingUp className="h-4 w-4" />
    
    // Professional Development
    case 'certifications':
      return <Award className="h-4 w-4" />
    case 'training_hours':
      return <BookOpen className="h-4 w-4" />
    case 'networking_events':
      return <Users className="h-4 w-4" />
    
    // Coaching Goals
    case 'coaching_sessions':
    case 'group_sessions':
    case 'active_mentees':
    case 'mentee_satisfaction':
    case 'response_time':
    case 'session_completion':
    case 'mentee_milestones':
      return <Trophy className="h-4 w-4" />
    
    // Custom/Other
    case 'custom':
      return <Settings className="h-4 w-4" />
    
    default:
      return <Target className="h-4 w-4" />
  }
}

const GoalsForm = ({ open, onClose, onSubmit }: GoalsFormProps) => {
  const [goals, setGoals] = useState<ClientGoal[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [formErrors, setFormErrors] = useState<ValidationError['details']['fieldErrors']>({})
  const [currentEditingGoal, setCurrentEditingGoal] = useState<ClientGoal | null>(null)
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);
  const FETCH_COOLDOWN = 2000; // 2 seconds cooldown between fetches

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      target: 0,
      current: 0,
      status: GOAL_STATUS.IN_PROGRESS,
      type: GOAL_TYPE.CUSTOM,
      deadline: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    const fetchGoalsWithCooldown = async () => {
      const now = Date.now();
      if (now - lastFetchTimestamp < FETCH_COOLDOWN) {
        console.log('[FETCH_SKIPPED]', {
          reason: 'cooldown',
          timeSinceLastFetch: now - lastFetchTimestamp,
          cooldown: FETCH_COOLDOWN,
          timestamp: new Date().toISOString()
        });
        return;
      }

      setIsLoadingGoals(true);
      try {
        const { data, error } = await fetchGoals({});
        
        if (error) {
          console.error('[LOAD_GOALS_ERROR]', {
            error,
            timestamp: new Date().toISOString()
          });
          toast.error("Failed to load goals");
          return;
        }
        
        if (data) {
          // Transform the data to match the ClientGoal interface
          const clientGoals: ClientGoal[] = data.map(goal => {
            const typedGoal = goal as any;
            
            // Parse target value correctly - handle both string JSON and object formats
            let targetValue = 0;
            if (typedGoal.target) {
              try {
                if (typeof typedGoal.target === 'string') {
                  // If it's a JSON string, parse it
                  const parsedTarget = JSON.parse(typedGoal.target);
                  targetValue = parsedTarget?.value || 0;
                } else if (typeof typedGoal.target === 'object') {
                  // If it's already an object, use the value directly
                  targetValue = typedGoal.target?.value || 0;
                }
              } catch (e) {
                console.error('[TARGET_PARSE_ERROR]', {
                  error: e,
                  target: typedGoal.target,
                  goalId: typedGoal.ulid,
                  timestamp: new Date().toISOString()
                });
              }
            }
            
            // Parse progress value correctly - handle both string JSON and object formats
            let progressValue = 0;
            if (typedGoal.progress) {
              try {
                if (typeof typedGoal.progress === 'string') {
                  // If it's a JSON string, parse it
                  const parsedProgress = JSON.parse(typedGoal.progress);
                  progressValue = parsedProgress?.value || 0;
                } else if (typeof typedGoal.progress === 'object') {
                  // If it's already an object, use the value directly
                  progressValue = typedGoal.progress?.value || 0;
                }
              } catch (e) {
                console.error('[PROGRESS_PARSE_ERROR]', {
                  error: e,
                  progress: typedGoal.progress,
                  goalId: typedGoal.ulid,
                  timestamp: new Date().toISOString()
                });
              }
            }
            
            // Parse the due date correctly
            let deadline = typedGoal.dueDate;
            if (deadline) {
              try {
                // Try to format the date as YYYY-MM-DD for form compatibility
                const date = new Date(deadline);
                if (!isNaN(date.getTime())) {
                  deadline = date.toISOString().split('T')[0];
                }
              } catch (e) {
                console.error('[DATE_PARSE_ERROR]', {
                  error: e,
                  dueDate: typedGoal.dueDate,
                  goalId: typedGoal.ulid,
                  timestamp: new Date().toISOString()
                });
              }
            }
            
            return {
              ulid: typedGoal.ulid,
              userUlid: typedGoal.userUlid,
              organizationUlid: typedGoal.organizationUlid,
              title: typedGoal.title,
              description: typedGoal.description || null,
              target: targetValue,
              current: progressValue,
              deadline: deadline,
              type: typedGoal.type as GoalType,
              status: typedGoal.status as GoalStatus,
              createdAt: typedGoal.createdAt || new Date().toISOString(),
              updatedAt: typedGoal.updatedAt || new Date().toISOString(),
              organization: typedGoal.organization,
              user: typedGoal.user
            };
          });
          
          setGoals(clientGoals);
          setLastFetchTimestamp(now);
        }
      } catch (error) {
        console.error("[LOAD_GOALS_ERROR]", {
          error,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        toast.error("Failed to load goals");
      } finally {
        setIsLoadingGoals(false);
        setIsInitialLoading(false);
      }
    };

    fetchGoalsWithCooldown();
  }, [lastFetchTimestamp]);

  const loadGoals = async () => {
    const now = Date.now();
    if (now - lastFetchTimestamp < FETCH_COOLDOWN) {
      console.log('[MANUAL_FETCH_SKIPPED]', {
        reason: 'cooldown',
        timeSinceLastFetch: now - lastFetchTimestamp,
        cooldown: FETCH_COOLDOWN,
        timestamp: new Date().toISOString()
      });
      return;
    }
    setLastFetchTimestamp(now);
  };

  const handleSubmit: SubmitHandler<GoalFormValues> = async (data) => {
    setIsLoading(true);
    
    try {
      // Validate the data against our schema
      const validationResult = goalSchema.safeParse(data);
      
      if (!validationResult.success) {
        console.error('[GOAL_VALIDATION_ERROR]', {
          errors: validationResult.error.flatten(),
          timestamp: new Date().toISOString()
        });
        
        // Set form errors
        const fieldErrors = validationResult.error.flatten().fieldErrors;
        (Object.keys(fieldErrors) as Array<keyof typeof fieldErrors>).forEach(field => {
          form.setError(field, {
            type: 'manual',
            message: fieldErrors[field]?.[0]
          });
        });
        
        toast.error('Please fill in all required fields correctly');
        return;
      }

      // Prepare the goal data for the onSubmit handler
      const formValues: GoalFormValues = {
        title: data.title,
        description: data.description,
        target: data.target,
        current: data.current,
        deadline: data.deadline,
        type: data.type,
        status: data.status || GOAL_STATUS.IN_PROGRESS,
      };

      console.log('[GOAL_SUBMIT]', {
        data: formValues,
        isEdit: !!currentEditingGoal,
        timestamp: new Date().toISOString()
      });

      if (currentEditingGoal) {
        // For editing, format data for the updateOrganizationGoal API
        const apiData = {
          title: data.title,
          description: data.description || "",
          target: { 
            value: Number(data.target)  // Ensure it's converted to a number
          },
          progress: { 
            value: Number(data.current), // Ensure it's converted to a number
            lastUpdated: new Date().toISOString()
          },
          startDate: new Date(currentEditingGoal.createdAt),
          dueDate: new Date(data.deadline),
          type: data.type,
          status: data.status || GOAL_STATUS.IN_PROGRESS,
        };
        
        console.log('[UPDATE_GOAL_DATA]', {
          goalId: currentEditingGoal.ulid,
          data: apiData,
          timestamp: new Date().toISOString()
        });
        
        const result = await updateOrganizationGoal({ 
          goalUlid: currentEditingGoal.ulid,
          data: apiData 
        });
        if (result.error) {
          console.error('[UPDATE_GOAL_ERROR]', {
            error: result.error,
            timestamp: new Date().toISOString()
          });
          throw result.error;
        }

        // Force an immediate refresh of goals after update
        const { data: freshGoals, error } = await fetchGoals({});
        if (!error && freshGoals) {
          // Transform the data to match the ClientGoal interface
          const clientGoals: ClientGoal[] = freshGoals.map(goal => {
            const typedGoal = goal as any;
            
            // Parse target value correctly
            let targetValue = 0;
            if (typedGoal.target) {
              try {
                if (typeof typedGoal.target === 'string') {
                  const parsedTarget = JSON.parse(typedGoal.target);
                  targetValue = parsedTarget?.value || 0;
                } else if (typeof typedGoal.target === 'object') {
                  targetValue = typedGoal.target?.value || 0;
                }
              } catch (e) {
                console.error('[TARGET_PARSE_ERROR]', {
                  error: e,
                  target: typedGoal.target,
                  goalId: typedGoal.ulid,
                  timestamp: new Date().toISOString()
                });
              }
            }
            
            // Parse progress value correctly
            let progressValue = 0;
            if (typedGoal.progress) {
              try {
                if (typeof typedGoal.progress === 'string') {
                  const parsedProgress = JSON.parse(typedGoal.progress);
                  progressValue = parsedProgress?.value || 0;
                } else if (typeof typedGoal.progress === 'object') {
                  progressValue = typedGoal.progress?.value || 0;
                }
              } catch (e) {
                console.error('[PROGRESS_PARSE_ERROR]', {
                  error: e,
                  progress: typedGoal.progress,
                  goalId: typedGoal.ulid,
                  timestamp: new Date().toISOString()
                });
              }
            }
            
            // Parse the due date correctly
            let deadline = typedGoal.dueDate;
            if (deadline) {
              try {
                const date = new Date(deadline);
                if (!isNaN(date.getTime())) {
                  deadline = date.toISOString().split('T')[0];
                }
              } catch (e) {
                console.error('[DATE_PARSE_ERROR]', {
                  error: e,
                  dueDate: typedGoal.dueDate,
                  goalId: typedGoal.ulid,
                  timestamp: new Date().toISOString()
                });
              }
            }
            
            return {
              ulid: typedGoal.ulid,
              userUlid: typedGoal.userUlid,
              organizationUlid: typedGoal.organizationUlid,
              title: typedGoal.title,
              description: typedGoal.description || null,
              target: targetValue,
              current: progressValue,
              deadline: deadline,
              type: typedGoal.type as GoalType,
              status: typedGoal.status as GoalStatus,
              createdAt: typedGoal.createdAt || new Date().toISOString(),
              updatedAt: typedGoal.updatedAt || new Date().toISOString(),
              organization: typedGoal.organization,
              user: typedGoal.user
            };
          });
          
          setGoals(clientGoals);
        }
      } else {
        // For new goals, use the form values
        await onSubmit(formValues);
      }
      
      toast.success(`Goal ${currentEditingGoal ? 'updated' : 'created'} successfully!`);
      handleCloseForm();
    } catch (error) {
      console.error('[SUBMIT_GOAL_ERROR]', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      toast.error('Failed to submit goal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGoal = (goal: ClientGoal) => {
    console.log('[EDIT_GOAL]', {
      goal,
      timestamp: new Date().toISOString()
    });
    
    // Reset form
    form.reset({
      title: goal.title,
      description: goal.description || '',
      // Ensure numeric values are properly converted
      target: typeof goal.target === 'number' ? goal.target : Number(goal.target) || 0,
      current: typeof goal.current === 'number' ? goal.current : Number(goal.current) || 0,
      deadline: goal.deadline || new Date().toISOString().split('T')[0],
      type: goal.type,
      status: goal.status
    });
    
    setCurrentEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setCurrentEditingGoal(null)
    form.reset({
      title: "",
      description: "",
      target: 0,
      current: 0,
      status: GOAL_STATUS.IN_PROGRESS,
      type: GOAL_TYPE.CUSTOM,
      deadline: new Date().toISOString().split('T')[0],
    })
  }

  const handleAddNewGoal = () => {
    setCurrentEditingGoal(null)
    form.reset({
      title: "",
      description: "",
      target: 0,
      current: 0,
      status: GOAL_STATUS.IN_PROGRESS,
      type: GOAL_TYPE.CUSTOM,
      deadline: new Date().toISOString().split('T')[0],
    })
    setIsFormOpen(true)
  }

  const handleDeleteGoal = async (goal: ClientGoal) => {
    setIsLoading(true)
    try {
      const { error } = await deleteGoalAction(goal.ulid)
      if (error) throw error
      toast.success("Goal deleted successfully")
      await loadGoals()
      handleCloseForm()
    } catch (error) {
      toast.error("Failed to delete goal")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "overdue":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getProgressPercentage = (current: number, target: number) => {
    if (!target || target <= 0) return 0;
    if (current >= target) return 100;
    
    // Calculate percentage with safety checks
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));
    
    // If it's not a valid number, return 0
    return isNaN(percentage) || !isFinite(percentage) ? 0 : percentage;
  };

  const getFormatForGoalType = (type: string): "number" | "currency" | "percentage" | "time" => {
    switch (type) {
      // Currency format
      case "sales_volume":
      case "commission_income":
      case "gci":
      case "avg_sale_price":
      case "session_revenue":
        return "currency"
      
      // Percentage format
      case "market_share":
      case "client_retention":
      case "mentee_satisfaction":
      case "session_completion":
        return "percentage"
      
      // Time format (hours)
      case "response_time":
      case "training_hours":
      case "days_on_market":
        return "time"
      
      // Number format (default)
      default:
        return "number"
    }
  }

  const getValueLabelSuffix = (type: string): string => {
    switch (getFormatForGoalType(type)) {
      case "currency":
        return " ($)"
      case "percentage":
        return " (%)"
      case "time":
        return " (hrs)"
      default:
        return ""
    }
  }

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case "percentage":
        return `${value}%`
      case "time":
        return `${value} hrs`
      default:
        return value.toLocaleString()
    }
  }

  const goalTypeOptions = [
    // Financial Goals
    { value: "sales_volume", label: "Sales Volume ($)", group: "Financial" },
    { value: "commission_income", label: "Commission Income ($)", group: "Financial" },
    { value: "gci", label: "Gross Commission Income ($)", group: "Financial" },
    { value: "avg_sale_price", label: "Average Sale Price ($)", group: "Financial" },
    
    // Transaction Goals
    { value: "listings", label: "Number of Listings", group: "Transactions" },
    { value: "buyer_transactions", label: "Buyer Transactions", group: "Transactions" },
    { value: "closed_deals", label: "Closed Deals", group: "Transactions" },
    { value: "days_on_market", label: "Days on Market", group: "Transactions" },
    
    // Coaching & Mentorship Goals
    { value: "coaching_sessions", label: "1:1 Coaching Sessions", group: "Coaching & Mentorship" },
    { value: "group_sessions", label: "Group Coaching Sessions", group: "Coaching & Mentorship" },
    { value: "session_revenue", label: "Session Revenue ($)", group: "Coaching & Mentorship" },
    { value: "active_mentees", label: "Active Mentees", group: "Coaching & Mentorship" },
    { value: "mentee_satisfaction", label: "Mentee Satisfaction (%)", group: "Coaching & Mentorship" },
    { value: "response_time", label: "Avg. Response Time (hrs)", group: "Coaching & Mentorship" },
    { value: "session_completion", label: "Session Completion Rate", group: "Coaching & Mentorship" },
    { value: "mentee_milestones", label: "Mentee Milestones Achieved", group: "Coaching & Mentorship" },
    
    // Client Goals
    { value: "new_clients", label: "New Clients", group: "Client Goals" },
    { value: "referrals", label: "Referrals", group: "Client Goals" },
    { value: "client_retention", label: "Client Retention Rate (%)", group: "Client Goals" },
    { value: "reviews", label: "Reviews/Testimonials", group: "Client Goals" },
    
    // Market Presence
    { value: "market_share", label: "Market Share (%)", group: "Market Presence" },
    { value: "territory_expansion", label: "New Territories", group: "Market Presence" },
    { value: "social_media", label: "Social Media Growth", group: "Market Presence" },
    { value: "website_traffic", label: "Website Visitors", group: "Market Presence" },
    
    // Professional Development
    { value: "certifications", label: "Certifications", group: "Professional Development" },
    { value: "training_hours", label: "Training Hours", group: "Professional Development" },
    { value: "networking_events", label: "Networking Events", group: "Professional Development" },
    
    // Other
    { value: "custom", label: "Custom Goal", group: "Other" },
  ]

  // Group goals by personal and organization
  const personalGoals = goals.filter(goal => !goal.organizationUlid || goal.userUlid === goal.organizationUlid);
  const organizationGoals = goals.filter(goal => goal.organizationUlid && goal.userUlid !== goal.organizationUlid);

  return (
    <div className="space-y-8">
      {/* Goals List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Your Goals</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Goals are visible to coaches you have booked sessions with and to your brokerage if connected
            </p>
          </div>
          <Button 
            onClick={handleAddNewGoal}
            className="flex items-center gap-2"
            disabled={isLoading || isInitialLoading}
          >
            <PlusCircle className="h-4 w-4" />
            Add New Goal
          </Button>
        </div>

        {isInitialLoading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ) : goals.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <p className="mb-4">You haven't set any goals yet.</p>
              <Button onClick={handleAddNewGoal} variant="outline" disabled={isLoading}>
                Create Your First Goal
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-8">
            {personalGoals.length > 0 && (
              <div>
                <h4 className="text-md font-semibold mb-4">Your Personal Goals</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {personalGoals.map((goal) => (
                    <Card key={goal.ulid} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{goal.title}</h4>
                          <Badge variant="secondary" className="mt-1 flex items-center gap-1.5">
                            {getGoalTypeIcon(goal.type)}
                            {goal.type.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGoal(goal)}
                            className="h-8 w-8 p-0"
                            disabled={isLoading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                      <div className="mt-4 space-y-2">
                        <div className="text-sm font-medium text-gray-700">Progress:</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${getProgressPercentage(goal.current, goal.target)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatValue(goal.current, getFormatForGoalType(goal.type))} / {formatValue(goal.target, getFormatForGoalType(goal.type))}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {organizationGoals.length > 0 && (
              <div>
                <h4 className="text-md font-semibold mb-4">Organization Goals</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {organizationGoals.map((goal) => (
                    <Card key={goal.ulid} className="p-4 border-indigo-300">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{goal.title}</h4>
                            {goal.organization && (
                              <Badge variant="outline" className="bg-indigo-50">
                                {goal.organization.name}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary" className="mt-1 flex items-center gap-1.5">
                            {getGoalTypeIcon(goal.type)}
                            {goal.type.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Badge>
                        </div>
                        <Badge className={getStatusColor(goal.status)}>
                          {goal.status.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                      <div className="mt-4 space-y-2">
                        <div className="text-sm font-medium text-gray-700">Progress:</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-indigo-500 rounded-full"
                              style={{ width: `${getProgressPercentage(goal.current, goal.target)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatValue(goal.current, getFormatForGoalType(goal.type))} / {formatValue(goal.target, getFormatForGoalType(goal.type))}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Goal Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !isLoading && !open && handleCloseForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentEditingGoal ? 'Update Goal' : 'Add New Goal'}
            </DialogTitle>
            <DialogDescription>
              Fields marked with <span className="text-destructive">*</span> are required
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Title <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your goal title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Type <span className="text-destructive">*</span></FormLabel>
                    <Select 
                      onValueChange={(value: GoalType) => {
                        field.onChange(value)
                        // Reset target and current values when type changes to prevent formatting issues
                        form.setValue("target", 0)
                        form.setValue("current", 0)
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a goal type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(
                          goalTypeOptions.reduce((acc, option) => {
                            if (!acc[option.group]) {
                              acc[option.group] = []
                            }
                            acc[option.group].push({
                              ...option,
                              value: GOAL_TYPE[option.value.toUpperCase() as keyof typeof GOAL_TYPE]
                            })
                            return acc
                          }, {} as Record<string, typeof goalTypeOptions>)
                        ).map(([group, options]) => (
                          <SelectGroup key={group}>
                            <SelectLabel>{group}</SelectLabel>
                            {options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          {getFormatForGoalType(form.getValues("type")) === "currency" && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          )}
                          <Input 
                            type="number"
                            placeholder="Enter your target value"
                            {...field}
                            value={field.value || ""}
                            className={
                              getFormatForGoalType(form.getValues("type")) === "currency" 
                                ? "pl-7" 
                                : getFormatForGoalType(form.getValues("type")) === "percentage" || getFormatForGoalType(form.getValues("type")) === "time"
                                  ? "pr-12"
                                  : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                            step={getFormatForGoalType(form.getValues("type")) === "currency" ? "0.01" : "1"}
                            min="0"
                          />
                          {getFormatForGoalType(form.getValues("type")) === "percentage" && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                          )}
                          {getFormatForGoalType(form.getValues("type")) === "time" && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">hrs</span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Value <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          {getFormatForGoalType(form.getValues("type")) === "currency" && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          )}
                          <Input 
                            type="number"
                            placeholder="Enter current progress"
                            {...field}
                            value={field.value || ""}
                            className={
                              getFormatForGoalType(form.getValues("type")) === "currency" 
                                ? "pl-7" 
                                : getFormatForGoalType(form.getValues("type")) === "percentage" || getFormatForGoalType(form.getValues("type")) === "time"
                                  ? "pr-12"
                                  : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                            step={getFormatForGoalType(form.getValues("type")) === "currency" ? "0.01" : "1"}
                            min="0"
                          />
                          {getFormatForGoalType(form.getValues("type")) === "percentage" && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                          )}
                          {getFormatForGoalType(form.getValues("type")) === "time" && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">hrs</span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="text-muted-foreground text-sm">(Optional)</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Add additional details about your goal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status <span className="text-muted-foreground text-sm">(Defaults to In Progress)</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={GOAL_STATUS.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={GOAL_STATUS.COMPLETED}>Completed</SelectItem>
                        <SelectItem value={GOAL_STATUS.OVERDUE}>Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center gap-3">
                {currentEditingGoal && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isLoading}
                      >
                        Delete Goal
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{currentEditingGoal.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDeleteGoal(currentEditingGoal)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <div className="flex gap-3 ml-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseForm}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {currentEditingGoal ? 'Update Goal' : 'Add Goal'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GoalsForm 