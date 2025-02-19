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
import { PlusCircle, Pencil, X, Loader2 } from "lucide-react"
import { createGoal, updateGoal, deleteGoal, fetchGoals } from "@/utils/actions/goals"
import { toast } from "sonner"
import { Goal, GoalFormValues, GOAL_TYPE, GOAL_STATUS, GOAL_FORMAT, type GoalType, type GoalStatus, type GoalFormat } from "@/utils/types/goals"
import { type ValidationError } from "@/utils/types/errors"

// Validation schema
const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  target: z.number().min(0, "Target must be a positive number"),
  current: z.number().min(0, "Current value must be a positive number"),
  deadline: z.string().min(1, "Deadline is required"),
  type: z.enum(Object.values(GOAL_TYPE) as [string, ...string[]]),
  status: z.enum(Object.values(GOAL_STATUS) as [string, ...string[]]).default(GOAL_STATUS.IN_PROGRESS),
})

// Database types following .cursorrules conventions

interface GoalsFormProps {
  open: boolean;
  onClose: () => void;
}

const GoalsForm = ({ open, onClose }: GoalsFormProps) => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [formErrors, setFormErrors] = useState<ValidationError['details']['fieldErrors']>({})
  const [currentEditingGoal, setCurrentEditingGoal] = useState<Goal | null>(null)

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
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      console.log('[LOAD_GOALS_START]', {
        timestamp: new Date().toISOString()
      });

      const { data, error } = await fetchGoals({})
      
      if (error) {
        console.error('[LOAD_GOALS_ERROR]', {
          error,
          timestamp: new Date().toISOString()
        });
        toast.error("Failed to load goals")
        return
      }
      
      if (data) {
        console.log('[LOAD_GOALS_SUCCESS]', {
          count: data.length,
          timestamp: new Date().toISOString()
        });
        setGoals(data)
      }
    } catch (error) {
      console.error("[LOAD_GOALS_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to load goals")
    } finally {
      setIsInitialLoading(false)
    }
  }

  const handleSubmit: SubmitHandler<GoalFormValues> = async (data) => {
    setIsLoading(true);
    
    try {
      const baseGoalData = {
        title: data.title,
        description: data.description,
        target: data.target,
        current: data.current,
        deadline: data.deadline,
        type: data.type,
        status: data.status,
      };

      const result = currentEditingGoal 
        ? await updateGoal({ 
            goalUlid: currentEditingGoal.ulid,
            ...baseGoalData 
          })
        : await createGoal(baseGoalData);
      
      if (result.error) {
        console.error('[SUBMIT_GOAL_ERROR]', result.error);
        if (result.error.code === 'VALIDATION_ERROR') {
          const validationError = result.error as ValidationError;
          setFormErrors(validationError.details.fieldErrors);
          toast.error(Object.values(validationError.details.fieldErrors).flat().join('\n'));
        } else {
          toast.error(result.error.message);
        }
        return;
      }

      toast.success(`Goal ${currentEditingGoal ? 'updated' : 'created'} successfully!`);
      await loadGoals();
      handleCloseForm();
    } catch (error) {
      console.error('[SUBMIT_GOAL_ERROR]', error);
      toast.error('Failed to submit goal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setCurrentEditingGoal(goal)
    form.reset({
      title: goal.title,
      description: goal.description || "",
      target: goal.target,
      current: goal.current,
      deadline: new Date(goal.deadline).toISOString().split('T')[0],
      type: goal.type,
      status: goal.status,
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
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
    setShowForm(true)
  }

  const handleDeleteGoal = async (goal: Goal) => {
    setIsLoading(true)
    try {
      const { error } = await deleteGoal({ goalUlid: goal.ulid })
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
    return Math.min(Math.round((current / target) * 100), 100)
  }

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

  return (
    <div className="space-y-8">
      {/* Goals List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your Goals</h3>
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
          <div className="grid gap-4 md:grid-cols-2">
            {goals.map((goal) => (
              <Card key={goal.ulid} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{goal.title}</h4>
                    <Badge variant="secondary" className="mt-1">
                      {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
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
        )}
      </div>

      {/* Goal Form */}
      {showForm && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">
              {currentEditingGoal ? 'Update Goal' : 'Add New Goal'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseForm}
              className="h-8 w-8 p-0"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Title</FormLabel>
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
                    <FormLabel>Type</FormLabel>
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
                          <SelectValue placeholder="Select a type" />
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
                      <FormLabel>Target Value{getValueLabelSuffix(form.getValues("type"))}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          {getFormatForGoalType(form.getValues("type")) === "currency" && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          )}
                          <Input 
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value === 0 ? "" : field.value}
                            className={
                              getFormatForGoalType(form.getValues("type")) === "currency" 
                                ? "pl-7" 
                                : getFormatForGoalType(form.getValues("type")) === "percentage" || getFormatForGoalType(form.getValues("type")) === "time"
                                  ? "pr-12"
                                  : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                            onBlur={(e) => {
                              field.onBlur();
                              if (e.target.value === "") {
                                field.onChange(0);
                              }
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
                      <FormLabel>Current Value{getValueLabelSuffix(form.getValues("type"))}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          {getFormatForGoalType(form.getValues("type")) === "currency" && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          )}
                          <Input 
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value === 0 ? "" : field.value}
                            className={
                              getFormatForGoalType(form.getValues("type")) === "currency" 
                                ? "pl-7" 
                                : getFormatForGoalType(form.getValues("type")) === "percentage" || getFormatForGoalType(form.getValues("type")) === "time"
                                  ? "pr-12"
                                  : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                            onBlur={(e) => {
                              field.onBlur();
                              if (e.target.value === "") {
                                field.onChange(0);
                              }
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
                    <FormLabel>Deadline</FormLabel>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Enter goal description"
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
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
        </Card>
      )}
    </div>
  )
}

export default GoalsForm 