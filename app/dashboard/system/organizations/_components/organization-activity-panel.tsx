"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { Clock, RefreshCw, Filter, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'

interface OrganizationActivityPanelProps {
  orgId: string
}

// Mocked activity type for now, real implementation would come from API
interface Activity {
  id: string
  type: 'MEMBER_ADDED' | 'MEMBER_REMOVED' | 'SETTINGS_UPDATED' | 'STATUS_CHANGED' | 'PAYMENT_PROCESSED'
  description: string
  performedBy: {
    name: string
    id: string
    role: string
  }
  timestamp: string
  details?: Record<string, any>
}

export function OrganizationActivityPanel({ orgId }: OrganizationActivityPanelProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, this would be an API call
      // For now, mock the data
      setTimeout(() => {
        const mockActivities: Activity[] = [
          {
            id: '1',
            type: 'MEMBER_ADDED',
            description: 'New member added to the organization',
            performedBy: {
              name: 'Admin User',
              id: 'user-123',
              role: 'SYSTEM_OWNER'
            },
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: {
              memberName: 'Jane Doe',
              memberEmail: 'jane@example.com',
              role: 'MEMBER'
            }
          },
          {
            id: '2',
            type: 'SETTINGS_UPDATED',
            description: 'Organization settings updated',
            performedBy: {
              name: 'Admin User',
              id: 'user-123',
              role: 'SYSTEM_OWNER'
            },
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            details: {
              changes: ['name', 'description', 'tier']
            }
          },
          {
            id: '3',
            type: 'STATUS_CHANGED',
            description: 'Organization status changed to ACTIVE',
            performedBy: {
              name: 'Admin User',
              id: 'user-123',
              role: 'SYSTEM_OWNER'
            },
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            details: {
              previousStatus: 'PENDING',
              newStatus: 'ACTIVE'
            }
          },
          {
            id: '4',
            type: 'PAYMENT_PROCESSED',
            description: 'Subscription payment processed',
            performedBy: {
              name: 'System',
              id: 'system',
              role: 'SYSTEM'
            },
            timestamp: new Date(Date.now() - 259200000).toISOString(),
            details: {
              amount: '$99.99',
              plan: 'PROFESSIONAL',
              status: 'SUCCESS'
            }
          },
          {
            id: '5',
            type: 'MEMBER_REMOVED',
            description: 'Member removed from organization',
            performedBy: {
              name: 'Admin User',
              id: 'user-123',
              role: 'SYSTEM_OWNER'
            },
            timestamp: new Date(Date.now() - 432000000).toISOString(),
            details: {
              memberName: 'John Smith',
              memberEmail: 'john@example.com',
              reason: 'No longer with company'
            }
          }
        ]
        
        setActivities(mockActivities)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('[FETCH_ACTIVITIES_ERROR]', error)
      toast({
        title: 'Error',
        description: 'Failed to load activity logs',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [orgId])

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await fetchActivities()
      toast({
        title: 'Success',
        description: 'Activity logs refreshed'
      })
    } catch (error) {
      console.error('[REFRESH_ACTIVITIES_ERROR]', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh activity logs',
        variant: 'destructive'
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getActivityBadgeVariant = (type: Activity['type']) => {
    switch (type) {
      case 'MEMBER_ADDED':
        return 'default'
      case 'MEMBER_REMOVED':
        return 'destructive'
      case 'SETTINGS_UPDATED':
        return 'secondary'
      case 'STATUS_CHANGED':
        return 'outline'
      case 'PAYMENT_PROCESSED':
        return 'success'
      default:
        return 'secondary'
    }
  }

  const filteredActivities = activities.filter(activity => 
    activityTypeFilter === 'all' || activity.type === activityTypeFilter
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Recent actions and changes in this organization
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={activityTypeFilter}
              onValueChange={setActivityTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Activities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="MEMBER_ADDED">Member Added</SelectItem>
                <SelectItem value="MEMBER_REMOVED">Member Removed</SelectItem>
                <SelectItem value="SETTINGS_UPDATED">Settings Updated</SelectItem>
                <SelectItem value="STATUS_CHANGED">Status Changed</SelectItem>
                <SelectItem value="PAYMENT_PROCESSED">Payment Processed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No activity logs found.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="relative pl-6 pb-8 border-l">
                  <div className="absolute left-0 top-0 -ml-[7px] h-3.5 w-3.5 rounded-full border-2 border-primary bg-card"></div>
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getActivityBadgeVariant(activity.type)}>
                          {activity.type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          <Calendar className="inline-block h-3.5 w-3.5 mr-1" />
                          {formatDate(activity.timestamp)}
                        </span>
                      </div>
                      <p className="font-medium">{activity.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <User className="inline-block h-3.5 w-3.5 mr-1" />
                      {activity.performedBy.name}
                    </div>
                  </div>
                  
                  {activity.details && (
                    <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {Object.entries(activity.details).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2">
                          <span className="font-medium">{key}:</span>
                          <span>
                            {typeof value === 'object' 
                              ? Array.isArray(value) 
                                ? value.join(', ')
                                : JSON.stringify(value)
                              : String(value)
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 