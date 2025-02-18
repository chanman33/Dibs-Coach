'use client'

import { SystemAlert } from '@/utils/types/system'
import { formatDistanceToNow } from 'date-fns'
import { 
  AlertTriangle, 
  Info, 
  AlertOctagon,
  Shield,
  Bell
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AlertsListProps {
  alerts: SystemAlert[]
}

export function AlertsList({ alerts }: AlertsListProps) {
  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'security':
        return <Shield className="h-4 w-4 text-red-500" />
      case 'performance':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertOctagon className="h-4 w-4 text-red-500" />
      case 'notification':
        return <Bell className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500'
      case 'error':
        return 'bg-red-400'
      case 'warning':
        return 'bg-yellow-500'
      case 'info':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (!alerts.length) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No active alerts
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.ulid} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
          {getAlertIcon(alert.type, alert.severity)}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium">{alert.title}</h4>
                <p className="text-sm text-gray-600">{alert.message}</p>
              </div>
              <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                {alert.severity}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium">
                {alert.source}
              </span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(alert.createdAt))} ago</span>
              {alert.isResolved && (
                <>
                  <span>•</span>
                  <span className="text-green-500">Resolved</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 