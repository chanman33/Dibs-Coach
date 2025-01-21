"use client"

import { Separator } from "@/components/ui/separator"
import { ROLES, type UserRole } from "@/utils/roles/roles"
import config from "@/config"
import clsx from "clsx"
import { 
  Users, 
  CalendarDays, 
  HomeIcon, 
  MessageSquare, 
  ClipboardList, 
  UserCircle, 
  BarChart,
  Target,
  GraduationCap,
  Building2,
  ChevronDown,
  ChevronUp,
  Trophy
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface UnifiedSidebarProps {
  userRole: UserRole;
}

export default function UnifiedSidebar({ userRole }: UnifiedSidebarProps) {
  const pathname = usePathname()
  const [isCoachToolsExpanded, setIsCoachToolsExpanded] = useState(true)
  const [isRealtorToolsExpanded, setIsRealtorToolsExpanded] = useState(true)

  // When roles are enabled, check actual role. When disabled, show everything
  const isCoach = config.roles.enabled ? 
    (userRole === ROLES.REALTOR_COACH || userRole === ROLES.LOAN_OFFICER_COACH) : 
    true // Show coach features when roles disabled
  
  const isRealtor = config.roles.enabled ? 
    userRole === ROLES.REALTOR : 
    true // Show realtor features when roles disabled

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
          <Link className="flex items-center gap-2 font-semibold ml-1" href={isCoach ? "/dashboard/coach" : "/dashboard/realtor"}>
            <span>{config.roles.enabled ? (isCoach ? "Coach Portal" : "Realtor Portal") : "Development Portal"}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {/* Common Features */}
            <NavLink href={isCoach ? "/dashboard/coach" : "/dashboard/realtor"} icon={HomeIcon}>
              Dashboard
            </NavLink>
            <NavLink 
              href={isCoach ? "/dashboard/coach/profile" : "/dashboard/realtor/profile"} 
              icon={UserCircle}
            >
              Profile
            </NavLink>
            <NavLink 
              href={isCoach ? "/dashboard/coach/calendar" : "/dashboard/realtor/calendar"} 
              icon={CalendarDays}
            >
              Calendar
            </NavLink>
            <NavLink 
              href={isCoach ? "/dashboard/coach/messages" : "/dashboard/realtor/messages"} 
              icon={MessageSquare}
            >
              Messages
            </NavLink>

            {/* Realtor Primary Features */}
            {isRealtor && (
              <>
                <Separator className="my-3" />
                <NavLink href="/dashboard/realtor/coaches" icon={GraduationCap}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Find Coaches</span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                      Grow
                    </span>
                  </div>
                </NavLink>
                <NavLink href="/dashboard/realtor/goals" icon={Target}>
                  Goals & Plans
                </NavLink>
              </>
            )}

            {/* Coach Tools */}
            {isCoach && (
              <>
                <Separator className="my-3" />
                <button
                  onClick={() => setIsCoachToolsExpanded(!isCoachToolsExpanded)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                >
                  <span className="font-semibold">Coach Tools</span>
                  {isCoachToolsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isCoachToolsExpanded && (
                  <div className="pl-3 grid gap-1">
                    <NavLink href="/dashboard/coach/crm" icon={Users}>
                      Clients
                    </NavLink>
                    <NavLink href="/dashboard/coach/sessions" icon={ClipboardList}>
                      Sessions
                    </NavLink>
                    <NavLink href="/dashboard/coach/goals" icon={Trophy}>
                      Goals & Milestones
                    </NavLink>
                    <NavLink href="/dashboard/coach/analytics" icon={BarChart}>
                      Analytics
                    </NavLink>
                  </div>
                )}
              </>
            )}

            {/* Realtor Tools */}
            {isRealtor && (
              <>
                <Separator className="my-3" />
                <button
                  onClick={() => setIsRealtorToolsExpanded(!isRealtorToolsExpanded)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                >
                  <span className="font-semibold">Tools</span>
                  {isRealtorToolsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isRealtorToolsExpanded && (
                  <div className="pl-3">
                    <NavLink href="/dashboard/realtor/ai-listings" icon={Building2}>
                      AI Listing Generator
                    </NavLink>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
} 