"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Pencil, X } from "lucide-react"

const goalSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  category: z.enum([
    "CAREER_MILESTONE",
    "FINANCIAL",
    "LEARNING",
    "TRANSACTION",
    "CLIENT_ACQUISITION"
  ], {
    required_error: "Please select a category",
  }),
  targetDate: z.string().min(1, "Target date is required"),
  description: z.string().min(1, "Description is required"),
  progress: z.string().min(1, "Progress update is required"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).default("NOT_STARTED"),
})

type GoalFormValues = z.infer<typeof goalSchema>

interface GoalsFormProps {
  onSubmit: (data: any) => void
}

export default function GoalsForm({ onSubmit }: GoalsFormProps) {
  const [goals, setGoals] = useState<GoalFormValues[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalFormValues | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<GoalFormValues | null>(null)

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      progress: "",
      status: "NOT_STARTED",
    },
  })

  const handleSubmit = (data: GoalFormValues) => {
    let newGoals: GoalFormValues[]
    
    if (editingGoal) {
      // Update existing goal
      newGoals = goals.map(goal => 
        goal.id === editingGoal.id ? { ...data, id: editingGoal.id } : goal
      )
    } else {
      // Add new goal with unique ID
      newGoals = [...goals, { ...data, id: crypto.randomUUID() }]
    }
    
    setGoals(newGoals)
    onSubmit(newGoals)
    handleCloseForm()
  }

  const handleEditGoal = (goal: GoalFormValues) => {
    setEditingGoal(goal)
    form.reset(goal)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingGoal(null)
    form.reset({
      title: "",
      description: "",
      progress: "",
      status: "NOT_STARTED",
    })
  }

  const handleAddNewGoal = () => {
    setEditingGoal(null)
    form.reset({
      title: "",
      description: "",
      progress: "",
      status: "NOT_STARTED",
    })
    setShowForm(true)
  }

  const handleDeleteGoal = (goal: GoalFormValues) => {
    const newGoals = goals.filter(g => g.id !== goal.id)
    setGoals(newGoals)
    onSubmit(newGoals)
    setGoalToDelete(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-gray-500"
      case "IN_PROGRESS":
        return "bg-blue-500"
      case "COMPLETED":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, " ").toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-8">
      {/* Goals List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your Goals</h3>
          <Button 
            onClick={handleAddNewGoal}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Goal
          </Button>
        </div>

        {goals.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <p className="mb-4">You haven't set any goals yet.</p>
              <Button onClick={handleAddNewGoal} variant="outline">Create Your First Goal</Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {goals.map((goal) => (
              <Card key={goal.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{goal.title}</h4>
                    <Badge variant="secondary" className="mt-1">
                      {getCategoryLabel(goal.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status.replace(/_/g, " ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditGoal(goal)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-gray-700">Progress Update:</div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {goal.progress}
                  </p>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Target Date: {new Date(goal.targetDate).toLocaleDateString()}
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
              {editingGoal ? 'Update Goal' : 'Add New Goal'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseForm}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CAREER_MILESTONE">Career Milestone</SelectItem>
                        <SelectItem value="FINANCIAL">Financial</SelectItem>
                        <SelectItem value="LEARNING">Learning</SelectItem>
                        <SelectItem value="TRANSACTION">Transaction</SelectItem>
                        <SelectItem value="CLIENT_ACQUISITION">Client Acquisition</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date</FormLabel>
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
                        placeholder="Describe your goal and action steps..."
                        {...field}
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
                        <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress Update</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Example: Completed 3 out of 10 target transactions, Earned $50k out of $100k target, Finished 2 of 4 required certifications..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center gap-3">
                {editingGoal && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        Delete Goal
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{editingGoal.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDeleteGoal(editingGoal)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <div className="flex gap-3 ml-auto">
                  <Button type="button" variant="outline" onClick={handleCloseForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingGoal ? 'Update Goal' : 'Add Goal'}
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