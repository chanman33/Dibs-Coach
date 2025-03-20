"use client"

import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import {
  Users,
  Building2,
  HomeIcon,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronUp,
  Target,
  Briefcase,
  GraduationCap,
  DollarSign,
  UserCog,
  FileText,
  ClipboardList,
  CalendarClock,
  BadgePercent,
  Star
} from "lucide-react"

export function BusinessSidebar() {
  const pathname = usePathname()
  const [isTeamExpanded, setIsTeamExpanded] = useState(true)
  const [isCoachingExpanded, setIsCoachingExpanded] = useState(true)
  const [isPerformanceExpanded, setIsPerformanceExpanded] = useState(true)
  const [isAdminExpanded, setIsAdminExpanded] = useState(false)
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false)

  const NavLink = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
        pathname === href && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  )

  return (
    <div className="lg:block hidden border-r h-full">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[55px] items-center justify-between border-b px-3 w-full">
          <Link className="flex items-center gap-2 font-semibold ml-1" href="/dashboard/business">
            <span>Business Portal</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {/* Main Dashboard */}
            <NavLink href="/dashboard/business" icon={HomeIcon}>
              Dashboard
            </NavLink>

            {/* Team Management */}
            <Separator className="my-3" />
            <button
              onClick={() => setIsTeamExpanded(!isTeamExpanded)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            >
              <span className="font-semibold">Team Management</span>
              {isTeamExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isTeamExpanded && (
              <div className="pl-3 grid gap-1">
                <NavLink href="/dashboard/business/team/members" icon={Users}>
                  Team Directory
                </NavLink>
              </div>
            )}
            
            {/* Coaching & Development */}
            <Separator className="my-3" />
            <button
              onClick={() => setIsCoachingExpanded(!isCoachingExpanded)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            >
              <span className="font-semibold">Coaching & Development</span>
              {isCoachingExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isCoachingExpanded && (
              <div className="pl-3 grid gap-1">
                <NavLink href="/dashboard/business/coaching/sessions" icon={CalendarClock}>
                  Coaching Sessions
                </NavLink>
                <NavLink href="/dashboard/business/coaching/training" icon={GraduationCap}>
                  Training Programs
                </NavLink>
              </div>
            )}

            {/* Performance & Goals */}
            <Separator className="my-3" />
            <button
              onClick={() => setIsPerformanceExpanded(!isPerformanceExpanded)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            >
              <span className="font-semibold">Performance & Goals</span>
              {isPerformanceExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isPerformanceExpanded && (
              <div className="pl-3 grid gap-1">
                <NavLink href="/dashboard/business/performance/goals" icon={Target}>
                  Goal Tracking
                </NavLink>
                <NavLink href="/dashboard/business/performance/development" icon={UserCog}>
                  Development Plans
                </NavLink>
                <NavLink href="/dashboard/business/performance/analytics" icon={BarChart3}>
                  Performance Metrics
                </NavLink>
              </div>
            )}

            {/* Business Administration */}
            <Separator className="my-3" />
            <button
              onClick={() => setIsAdminExpanded(!isAdminExpanded)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            >
              <span className="font-semibold">Admin & Settings</span>
              {isAdminExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isAdminExpanded && (
              <div className="pl-3 grid gap-1">
                <NavLink href="/dashboard/business/profile" icon={Building2}>
                  Business Profile
                </NavLink>
                <NavLink href="/dashboard/business/team/roles" icon={Briefcase}>
                  Roles & Permissions
                </NavLink>
                <NavLink href="/dashboard/business/admin/users" icon={Users}>
                  User Management
                </NavLink>
                <NavLink href="/dashboard/business/admin/billing" icon={DollarSign}>
                  Billing & Subscription
                </NavLink>
                <NavLink href="/dashboard/business/admin/commission" icon={BadgePercent}>
                  Commission Structure
                </NavLink>
              </div>
            )}

            {/* Settings */}
            <Separator className="my-3" />
            <NavLink href="/dashboard/business/settings" icon={Settings}>
              Settings
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  )
} 