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
  UserCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Briefcase,
  GraduationCap,
  Bot,
  Calculator,
  LineChart,
  Network,
  Globe,
  Map,
  Star,
} from "lucide-react"

export function BusinessSidebar() {
  const pathname = usePathname()
  const [isTeamExpanded, setIsTeamExpanded] = useState(true)
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(true)

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
            {/* Main Navigation */}
            <NavLink href="/dashboard/business" icon={HomeIcon}>
              Overview
            </NavLink>
            <NavLink href="/dashboard/business/profile" icon={Building2}>
              Business Profile
            </NavLink>

            {/* Team Management */}
            <Separator className="my-3" />
            <button
              onClick={() => setIsTeamExpanded(!isTeamExpanded)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            >
              <span className="font-semibold">Employee Management</span>
              {isTeamExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isTeamExpanded && (
              <div className="pl-3 grid gap-1">
                <NavLink href="/dashboard/business/employees" icon={Users}>
                  Employees
                </NavLink>
                <NavLink href="/dashboard/business/mentorship" icon={GraduationCap}>
                  Mentorship Program
                </NavLink>
                <NavLink href="/dashboard/business/preferred-coaches" icon={Star}>
                  Preferred Coaches
                </NavLink>
                <NavLink href="/dashboard/business/team/roles" icon={Briefcase}>
                  Roles & Permissions
                </NavLink>
              </div>
            )}
            
            {/* Analytics & Reports */}
            <Separator className="my-3" />
            <button
              onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            >
              <span className="font-semibold">Analytics & Reports</span>
              {isAnalyticsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isAnalyticsExpanded && (
              <div className="pl-3 grid gap-1">
                <NavLink href="/dashboard/business/analytics/performance" icon={BarChart3}>
                  Performance
                </NavLink>
                <NavLink href="/dashboard/business/analytics/revenue" icon={LineChart}>
                  Revenue
                </NavLink>
                <NavLink href="/dashboard/business/analytics/goals" icon={Target}>
                  Goals & KPIs
                </NavLink>
              </div>
            )}

            {/* Organization Management */}
            <Separator className="my-3" />
            <NavLink href="/dashboard/business/locations" icon={Map}>
              Locations
            </NavLink>
            <NavLink href="/dashboard/business/network" icon={Network}>
              Network
            </NavLink>
            <NavLink href="/dashboard/business/regions" icon={Globe}>
              Regions
            </NavLink>


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