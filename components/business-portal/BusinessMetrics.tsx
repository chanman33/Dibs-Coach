"use client"

import { useEffect, useState } from "react"
import { fetchBusinessCoachingMetrics } from "@/utils/actions/business-dashboard-actions"
import type { BusinessCoachingMetrics } from "@/utils/types/business"
import { AlertCircle, BarChart } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type MetricBarProps = {
  label: string
  value: number
  color: string
}

function MetricBar({ label, value, color }: MetricBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full">
        <div 
          className={`h-full rounded-full ${color}`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  )
}

export function BusinessMetrics() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<BusinessCoachingMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const loadMetrics = async () => {
    try {
      console.log('Fetching business metrics...')
      setLoading(true)
      setError(null)
      
      const response = await fetchBusinessCoachingMetrics({})
      
      console.log('Business metrics response:', response)
      
      if (response.error) {
        // Handle different error types
        if (response.error.code === 'NOT_FOUND') {
          setError('No organization data found. Please ensure you are part of an organization.')
        } else {
          setError(response.error.message || 'Failed to load business metrics')
        }
        setMetrics(null)
      } else {
        setMetrics(response.data)
      }
    } catch (err) {
      console.error('Error fetching business metrics:', err)
      setError('An unexpected error occurred while loading metrics')
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [retryCount])
  
  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1)
  }

  // Skeleton for loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium mb-3">Coaching Program Effectiveness</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Display error if any
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

  // Handle empty metrics with placeholder
  if (!metrics) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto rounded-full bg-muted p-3 w-12 h-12 flex items-center justify-center mb-4">
          <BarChart className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Metrics Available</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          We don't have enough data to generate meaningful metrics yet.
        </p>
        <Button size="sm" onClick={handleRetry} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-3">Coaching Program Effectiveness</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricBar
            label="Participation Rate"
            value={metrics.participationRate}
            color="bg-blue-500"
          />

          <MetricBar
            label="Completion Rate"
            value={metrics.completionRate}
            color="bg-green-500"
          />

          <MetricBar
            label="Satisfaction Score"
            value={metrics.satisfactionScore}
            color="bg-amber-500"
          />
        </div>
      </div>
    </div>
  )
} 