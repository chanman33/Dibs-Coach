'use client'

import { SystemActivity } from '@/utils/types/system'
import { formatDistanceToNow } from 'date-fns'
import { 
  AlertCircle,
  User,
  Settings,
  FileText,
  Activity
} from 'lucide-react'

interface ActivityFeedProps {
  activities: SystemActivity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-blue-500" />
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />
      case 'document':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-purple-500" />
    }
  }

  if (!activities.length) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.ulid} className="flex gap-3 p-3 border-b border-gray-100 last:border-0">
          {getActivityIcon(activity.type)}
          <div>
            <h4 className="text-sm font-medium">{activity.title}</h4>
            <p className="text-sm text-gray-600">{activity.description}</p>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(activity.createdAt))} ago
            </span>
          </div>
        </div>
      ))}
    </div>
  )
} 