"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from './StatCard'
import { fetchBusinessStats, saveCoachingBudget } from '@/utils/actions/business-dashboard-actions'
import { AlertCircle, Users, GraduationCap, DollarSign, Calendar, Loader2, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

export function BusinessStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showBudgetDialog, setShowBudgetDialog] = useState(false)
  const [showBudgetDetailsDialog, setShowBudgetDetailsDialog] = useState(false)
  const [budgetAmount, setBudgetAmount] = useState('5000')
  const [savingBudget, setSavingBudget] = useState(false)
  const { toast } = useToast()

  // Function to refresh stats without changing retry count
  const refreshStats = async () => {
    console.log('Refreshing business stats...')
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchBusinessStats({})
      console.log('Business stats response:', response)
      
      if (response.error) {
        // Handle different error types
        if (response.error.code === 'NOT_FOUND') {
          setError('No organization data found. Please ensure you are part of an organization.')
        } else {
          setError(response.error.message || 'Failed to load business statistics')
        }
        setStats(null)
      } else {
        setStats(response.data)
      }
    } catch (err) {
      console.error('Error refreshing business stats:', err)
      setError('An unexpected error occurred while refreshing statistics')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const getStats = async () => {
    console.log('Fetching business stats...')
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchBusinessStats({})
      console.log('Business stats response:', response)
      
      if (response.error) {
        // Handle different error types
        if (response.error.code === 'NOT_FOUND') {
          setError('No organization data found. Please ensure you are part of an organization.')
        } else {
          setError(response.error.message || 'Failed to load business statistics')
        }
        setStats(null)
      } else {
        setStats(response.data)
        // If there's a budget, set it as the initial value in the dialog
        if (response.data?.coachingBudget) {
          setBudgetAmount(response.data.coachingBudget.toString())
        }
      }
    } catch (err) {
      console.error('Error fetching business stats:', err)
      setError('An unexpected error occurred while loading statistics')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getStats()
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1)
  }

  const handleSaveBudget = async () => {
    try {
      setSavingBudget(true);
      
      // Validate budget amount
      const amount = parseInt(budgetAmount, 10);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid budget amount",
          description: "Please enter a valid positive number for the budget",
          variant: "destructive",
        });
        setSavingBudget(false);
        return;
      }
      
      console.log(`Saving budget amount: $${amount}`);
      
      // Save budget to database using server action
      const result = await saveCoachingBudget(amount);
      
      if (!result.error) {
        toast({
          title: stats.isBudgetSet ? "Budget updated" : "Budget set",
          description: `Your team's monthly coaching budget has been ${stats.isBudgetSet ? 'updated' : 'set'} to $${amount.toLocaleString()}`,
        });
        
        // Refresh stats
        await refreshStats();
        
        // Close dialog
        setShowBudgetDialog(false);
      } else {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : result.error?.message || "Failed to save the budget. Please try again.";
          
        toast({
          title: "Error saving budget",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      toast({
        title: "Unexpected error",
        description: "Something went wrong while saving your budget. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingBudget(false);
    }
  };

  // Function to open dialog with current budget if editing
  const openBudgetDialog = useCallback(() => {
    // If budget is already set, use that value
    if (stats?.isBudgetSet) {
      setBudgetAmount(stats.coachingBudget.toString())
    }
    setShowBudgetDialog(true)
  }, [stats])

  // Handle dialog open/close
  const handleDialogChange = (open: boolean) => {
    setShowBudgetDialog(open);
    // Reset state when dialog closes
    if (!open) {
      // Reset to default or current budget based on if editing
      if (stats?.isBudgetSet) {
        setBudgetAmount(stats.coachingBudget.toString());
      } else {
        setBudgetAmount('5000');
      }
      setSavingBudget(false);
    }
  };

  // Add a new dialog for budget details
  const handleOpenBudgetDetails = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the edit dialog
    setShowBudgetDetailsDialog(true);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-[120px]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Skeleton className="h-8 w-[60px]" />
              </div>
              <div className="text-xs text-muted-foreground">
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <div className="mt-4">
            <Button size="sm" onClick={handleRetry} variant="outline">
              Retry
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs opacity-80">
              Development info: Check the console for more details.
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // If no stats available, show more helpful placeholder
  if (!stats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Business Statistics</CardTitle>
          <CardDescription>No statistics available at this time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This could be because:
          </p>
          <ul className="text-sm text-muted-foreground list-disc ml-5 mb-4">
            <li>You're in a new organization without any coaching data yet</li>
            <li>Your organization hasn't conducted any coaching sessions</li>
            <li>There's a temporary issue with data retrieval</li>
          </ul>
          <Button size="sm" onClick={handleRetry} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Team Size"
          value={stats.teamMemberCount}
          description={`${stats.teamMemberGrowth > 0 ? '+' : ''}${stats.teamMemberGrowth} from last quarter`}
          icon={Users}
        />
        <StatCard
          title="Active in Coaching"
          value={stats.activeInCoaching}
          description={`${stats.participationRate}% participation rate`}
          icon={GraduationCap}
        />
        {stats.isBudgetSet ? (
          <div className="cursor-pointer hover:opacity-90 transition-opacity" onClick={openBudgetDialog}>
            <StatCard
              title="Coaching Budget"
              value={`$${stats.coachingBudget.toLocaleString()}`}
              description={
                <div className="flex items-center">
                  <span>{`${stats.budgetUtilized}% utilized`}</span>
                  <button 
                    onClick={handleOpenBudgetDetails} 
                    className="ml-1 p-1 rounded-full hover:bg-muted"
                    aria-label="View budget details"
                  >
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              }
              icon={DollarSign}
            />
            <div className="text-xs text-muted-foreground text-center mt-1">Click to edit</div>
          </div>
        ) : (
          <Card className="relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                Coaching Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground mb-3">
                  Set your team's monthly coaching budget
                </p>
                <Button size="sm" variant="outline" className="mt-auto" onClick={openBudgetDialog}>
                  Set Budget
                </Button>
              </div>
            </CardContent>
            <div className="absolute top-2 right-2">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
          </Card>
        )}
        <StatCard
          title="Scheduled Sessions"
          value={stats.scheduledSessions}
          description={stats.upcomingPeriod}
          icon={Calendar}
        />
      </div>

      <Dialog open={showBudgetDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{stats.isBudgetSet ? 'Edit Coaching Budget' : 'Set Coaching Budget'}</DialogTitle>
            <DialogDescription>
              {stats.isBudgetSet 
                ? 'Update your team\'s monthly coaching budget amount.'
                : 'Set the monthly coaching budget for your team.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budgetAmount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="budgetAmount"
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => {
                    // Only allow valid numbers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setBudgetAmount(value);
                  }}
                  placeholder="5000"
                  className="pl-7"
                  min="1"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground px-4">
              This budget will be used to track team coaching expenditures.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBudget} disabled={savingBudget}>
              {savingBudget ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Budget'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Budget Details Dialog */}
      <Dialog open={showBudgetDetailsDialog} onOpenChange={setShowBudgetDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Budget Utilization Details</DialogTitle>
            <DialogDescription>
              See how your team's coaching budget is being utilized
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm font-medium mb-1">Total Budget</div>
                <div className="text-2xl font-bold">${stats.coachingBudget.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Monthly allocation</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm font-medium mb-1">Budget Used</div>
                <div className="text-2xl font-bold">${Math.round(stats.coachingBudget * stats.budgetUtilized / 100).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">{stats.budgetUtilized}% of total</div>
              </div>
            </div>
            
            {/* Utilization Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Budget Utilization</span>
                <span>{stats.budgetUtilized}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    stats.budgetUtilized > 85
                      ? 'bg-destructive'
                      : stats.budgetUtilized > 60
                      ? 'bg-amber-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stats.budgetUtilized, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.budgetUtilized > 85
                  ? 'You are nearing your budget limit'
                  : stats.budgetUtilized > 60
                  ? 'Your budget utilization is moderate'
                  : 'Your budget utilization is healthy'}
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium">Budget Breakdown</div>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span>Sessions conducted</span>
                  <span>{stats.activeInCoaching} sessions</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span>Average cost per session</span>
                  <span>$250</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span>Remaining budget</span>
                  <span>${Math.round(stats.coachingBudget * (100 - stats.budgetUtilized) / 100).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                <p>Budget utilization is calculated based on completed coaching sessions.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBudgetDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Toaster />
    </>
  )
} 