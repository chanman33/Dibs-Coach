'use client'

import { SystemHealth } from '@/utils/types/system'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  Cpu,
  HardDrive,
  Memory
} from 'lucide-react'

interface SystemHealthIndicatorProps {
  health: SystemHealth
}

export function SystemHealthIndicator({ health }: SystemHealthIndicatorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500'
      case 'degraded':
        return 'text-yellow-500'
      case 'critical':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'critical':
        return <AlertOctagon className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getProgressColor = (value: number) => {
    if (value < 50) return 'bg-green-500'
    if (value < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <div className="flex items-center gap-2">
        {getStatusIcon(health.status)}
        <span className={`font-medium ${getStatusColor(health.status)}`}>
          System Status: {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
        </span>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">CPU Usage</span>
          </div>
          <Progress 
            value={health.cpuUsage} 
            className="h-2"
            indicatorClassName={getProgressColor(health.cpuUsage)}
          />
          <span className="text-xs text-gray-500">{health.cpuUsage}%</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Memory className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Memory Usage</span>
          </div>
          <Progress 
            value={health.memoryUsage} 
            className="h-2"
            indicatorClassName={getProgressColor(health.memoryUsage)}
          />
          <span className="text-xs text-gray-500">{health.memoryUsage}%</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Disk Usage</span>
          </div>
          <Progress 
            value={health.diskUsage} 
            className="h-2"
            indicatorClassName={getProgressColor(health.diskUsage)}
          />
          <span className="text-xs text-gray-500">{health.diskUsage}%</span>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-sm">
          <span className="text-gray-500">Uptime</span>
          <p className="font-medium">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</p>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Response Time</span>
          <p className="font-medium">{health.responseTime}ms</p>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Error Rate</span>
          <p className="font-medium">{health.errorRate}%</p>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Last Updated</span>
          <p className="font-medium">{new Date(health.lastChecked).toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Issues */}
      {health.issues && health.issues.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Active Issues</h4>
          <ul className="text-sm space-y-1">
            {health.issues.map((issue, index) => (
              <li key={index} className="text-red-500">• {issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 