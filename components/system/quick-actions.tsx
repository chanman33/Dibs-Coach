'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  UserCheck,
  FileText,
  Settings,
  Bell,
  Shield,
  ArrowUpRight
} from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      label: 'User Management',
      href: '/dashboard/system/user-mgmt',
      icon: Users,
      description: 'Manage users, roles, and permissions'
    },
    {
      label: 'Coach Applications',
      href: '/dashboard/system/coach-applications',
      icon: UserCheck,
      description: 'Review and process coach applications'
    },
    {
      label: 'System Reports',
      href: '/dashboard/system/analytics/reports',
      icon: FileText,
      description: 'View detailed system analytics and reports'
    },
    {
      label: 'System Settings',
      href: '/dashboard/system/settings',
      icon: Settings,
      description: 'Configure system-wide settings'
    },
    {
      label: 'Notifications',
      href: '/dashboard/system/notifications',
      icon: Bell,
      description: 'Manage system notifications and alerts'
    },
    {
      label: 'Security',
      href: '/dashboard/system/security',
      icon: Shield,
      description: 'Monitor and manage system security'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                asChild
              >
                <Link href={action.href}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{action.label}</span>
                    <ArrowUpRight className="h-3 w-3 ml-auto" />
                  </div>
                  <p className="text-sm text-gray-500 text-left">
                    {action.description}
                  </p>
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 