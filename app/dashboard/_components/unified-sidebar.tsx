"use client"

import { Separator } from "@/components/ui/separator"
import { ROLES, type UserRoles, hasAnyRole } from "@/utils/roles/roles"
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
  Trophy,
  Calculator
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"

export function UnifiedSidebar() {
  const { user } = useUser()
  const [userRoles, setUserRoles] = useState<UserRoles>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRoles() {
      if (user?.id) {
        try {
          const response = await fetch(`/api/user/role?userId=${user.id}`)
          const data = await response.json()
          setUserRoles(data.roles)
        } catch (error) {
          console.error("[SIDEBAR_ROLE_FETCH_ERROR]", error)
          setUserRoles([ROLES.MENTEE])
        }
        setLoading(false)
      }
    }

    fetchUserRoles()
  }, [user?.id])

  if (loading) {
    return <div>Loading...</div>
  }

  const isAdmin = hasAnyRole(userRoles, [ROLES.ADMIN])
  const isCoach = hasAnyRole(userRoles, [ROLES.COACH])
  const isMentee = hasAnyRole(userRoles, [ROLES.MENTEE])

  const pathname = usePathname()
  const [isCoachToolsExpanded, setIsCoachToolsExpanded] = useState(true)
  const [isRealtorToolsExpanded, setIsRealtorToolsExpanded] = useState(true)

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
            <span>{config.roles.enabled ? getPortalTitle(isAdmin, isCoach, isMentee) : "Development Portal"}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {/* Common Features */}
            <NavLink href={isCoach ? "/dashboard/coach" : "/dashboard/realtor"} icon={HomeIcon}>
              Dashboard
            </NavLink>
            <NavLink
              href="/dashboard/profile"
              icon={UserCircle}
            >
              Profile
            </NavLink>
            <NavLink
              href="/dashboard/calendar"
              icon={CalendarDays}
            >
              Calendar
            </NavLink>
            <NavLink
              href="/dashboard/messages"
              icon={MessageSquare}
            >
              Messages
            </NavLink>
            <NavLink href="/dashboard/realtor/browse-coaches" icon={GraduationCap}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Browse Coaches</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                  Grow
                </span>
              </div>
            </NavLink>

            {/* Role-specific Links */}
            {isAdmin && (
              <>
                <li>
                  <NavLink href="/dashboard/admin/users" icon={Users}>
                    User Management
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/dashboard/admin/settings" icon={Users}>
                    System Settings
                  </NavLink>
                </li>
              </>
            )}

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
                    <NavLink href="/dashboard/coach/analytics" icon={BarChart}>
                      Finance & Analytics
                    </NavLink>
                  </div>
                )}
              </>
            )}

            {isMentee && (
              <>
                <li>
                  <NavLink href="/dashboard/mentee/sessions" icon={CalendarDays}>
                    My Sessions
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/dashboard/mentee/coaches" icon={GraduationCap}>
                    Find Coaches
                  </NavLink>
                </li>
              </>
            )}

            {/* Tools */}
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
                  <NavLink href="/dashboard/realtor/income-calc" icon={Calculator}>
                    Income Calculator
                  </NavLink>
                </div>
              )}
            </>
          </nav>
        </div>
      </div>
    </div>
  )
}

function getPortalTitle(isAdmin: boolean, isCoach: boolean, isMentee: boolean): string {
  if (isAdmin) return "Admin Portal"
  if (isCoach) return "Coach Portal"
  return "Mentee Portal"
}

interface SidebarLinkProps {
  href: string;
  icon: string;
  children: React.ReactNode;
}

function SidebarLink({ href, icon, children }: SidebarLinkProps) {
  return (
    <a
      href={href}
      className={clsx(
        "flex items-center gap-2 font-light px-3 py-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg text-base",
        pathname === href && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
      )}
    >
      <span className="text-xl">{icon}</span>
      {children}
    </a>
  )
} 