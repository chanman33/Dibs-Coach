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
  const [isAdminExpanded, setIsAdminExpanded] = useState(true)
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
    <div className="lg:block hidden border-r min-h-screen">
      <div className="flex flex-col gap-2 h-full">
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
                <NavLink href="/dashboard/business/coaching/goals" icon={Target}>
                  Goal Tracking
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
                <NavLink href="/dashboard/business/settings/profile" icon={Building2}>
                  Business Profile
                </NavLink>
                <NavLink href="/dashboard/business/settings/team" icon={Users}>
                  Team Management
                </NavLink>
                <NavLink href="/dashboard/business/settings/permissions" icon={Briefcase}>
                  Roles & Permissions
                </NavLink>
                <NavLink href="/dashboard/business/settings/billing" icon={DollarSign}>
                  Billing & Subscription
                </NavLink>


              </div>
            )}

          </nav>
        </div>
      </div>
    </div>
  )
}
