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
  Database
} from 'lucide-react'

interface SystemHealthIndicatorProps {
  health: SystemHealth
}

// Define status mapping for the numeric status code
const STATUS_MAP = {
  1: 'healthy',
  2: 'degraded',
  3: 'critical'
}

export function SystemHealthIndicator({ health }: SystemHealthIndicatorProps) {
  const getStatusColor = (status: number) => {
    const statusText = STATUS_MAP[status as keyof typeof STATUS_MAP] || 'unknown';
    switch (statusText) {
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

  const getStatusIcon = (status: number) => {
    const statusText = STATUS_MAP[status as keyof typeof STATUS_MAP] || 'unknown';
    switch (statusText) {
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

  // Default values for properties not in the SystemHealth type yet
  const cpuUsage = 20;
  const memoryUsage = 40;
  const diskUsage = 35;
  const responseTime = 120;
  const errorRate = 0.5;
  const lastChecked = health.updatedAt;
  const issues: string[] = [];

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <div className="flex items-center gap-2">
        {getStatusIcon(health.status)}
        <span className={`font-medium ${getStatusColor(health.status)}`}>
          System Status: {STATUS_MAP[health.status as keyof typeof STATUS_MAP] || 'Unknown'}
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
            value={cpuUsage} 
            className={`h-2 ${getProgressColor(cpuUsage)}`}
          />
          <span className="text-xs text-gray-500">{cpuUsage}%</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Memory Usage</span>
          </div>
          <Progress 
            value={memoryUsage} 
            className={`h-2 ${getProgressColor(memoryUsage)}`}
          />
          <span className="text-xs text-gray-500">{memoryUsage}%</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Disk Usage</span>
          </div>
          <Progress 
            value={diskUsage} 
            className={`h-2 ${getProgressColor(diskUsage)}`}
          />
          <span className="text-xs text-gray-500">{diskUsage}%</span>
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
          <p className="font-medium">{responseTime}ms</p>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Error Rate</span>
          <p className="font-medium">{errorRate}%</p>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Last Updated</span>
          <p className="font-medium">{new Date(lastChecked).toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Active Issues</h4>
          <ul className="text-sm space-y-1">
            {issues.map((issue, index) => (
              <li key={index} className="text-red-500">• {issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 