"use client"

import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { OrganizationSwitcher } from "@/components/organization/organization-switcher"
import {
  CalendarDays,
  HomeIcon,
  MessageSquare,
  UserCircle,
  GraduationCap,
  Building2,
  ChevronDown,
  ChevronUp,
  Calculator,
  Target,
  Bot,
  BookOpen,
  Briefcase,
  CreditCard,
  ListChecks
} from "lucide-react"
import { useCentralizedAuth } from '@/app/provider'
import { REAL_ESTATE_DOMAINS } from "@/utils/types/coach"
import { fetchUserCapabilities } from "@/utils/actions/user-profile-actions"
import { SidebarOrganizationSection } from "@/components/organization/sidebar-organization-section"
import { useOrganization } from "@/utils/auth/OrganizationContext"

export function MenteeSidebar() {
  const pathname = usePathname()
  const [isToolsExpanded, setIsToolsExpanded] = useState(true)
  const [isOrgExpanded, setIsOrgExpanded] = useState(true)
  const [isRealtorToolsExpanded, setIsRealtorToolsExpanded] = useState(true)
  const { authData: authContext } = useCentralizedAuth()
  const [hasRealtorDomain, setHasRealtorDomain] = useState(false)
  const { organizationName, organizationRole, organizations } = useOrganization()
  const hasOrganization = !!organizationName && organizations.length > 0

  useEffect(() => {
    const getUserDomains = async () => {
      try {
        const result = await fetchUserCapabilities()
        if (result.data) {
          const { realEstateDomains } = result.data
          const isRealtor = realEstateDomains?.includes(REAL_ESTATE_DOMAINS.REALTOR) || false

          setHasRealtorDomain(isRealtor)
        }
      } catch (error) {
        console.error("[FETCH_USER_DOMAINS_ERROR]", error)
      }
    }

    getUserDomains()
  }, [])

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
    <div className="lg:block hidden border-r h-screen sticky top-0">
      <div className="flex h-full flex-col">
        <div className="flex flex-col border-b">
          {/* Portal header */}
          <div className="flex h-[55px] items-center px-3">
            <Link className="flex items-center gap-2 font-semibold ml-1" href="/dashboard/mentee">
              <span>Mentee Portal</span>
            </Link>
          </div>
          
          {/* Organization Switcher - Uses the shared component */}
          <SidebarOrganizationSection />
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {/* Main Navigation */}
            <NavLink href="/dashboard/mentee" icon={HomeIcon}>
              Dashboard
            </NavLink>
            <NavLink href="/dashboard/mentee/profile" icon={UserCircle}>
              Profile
            </NavLink>

            <NavLink href="/dashboard/mentee/calendar" icon={CalendarDays}>
              Calendar
            </NavLink>
            {/* <NavLink href="/dashboard/mentee/messages" icon={MessageSquare}>
              Messages
            </NavLink> */}


            {/* Coaching */}
            <NavLink href="/dashboard/mentee/browse-coaches" icon={GraduationCap}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Browse Coaches</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                  Grow
                </span>
              </div>
            </NavLink>
            
            {/* Resource Library */}
            <Separator className="my-3" />
            <NavLink href="/dashboard/mentee/goals" icon={Target}>
              Goals
            </NavLink>
            <NavLink href="/dashboard/mentee/plans" icon={ListChecks}>
              Plans
            </NavLink>
            <NavLink href="/dashboard/resource-library" icon={BookOpen}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Library</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                  Learn
                </span>
              </div>
            </NavLink>

            {/* Organization Section - Only show if user belongs to an organization */}
            {hasOrganization && (
              <>
                <Separator className="my-3" />
                <button
                  onClick={() => setIsOrgExpanded(!isOrgExpanded)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                >
                  <span className="font-semibold">{organizationName}</span>
                  {isOrgExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isOrgExpanded && (
                  <div className="pl-3 grid gap-1">
                    <NavLink href="/dashboard/mentee/organization/overview" icon={Building2}>
                      Overview
                    </NavLink>
                  </div>
                )}
              </>
            )}

            {/* Shared Tools */}
            <Separator className="my-3" />

            {/* Realtor Tools - Only show if user has REALTOR domain */}
            {hasRealtorDomain && (
              <>
                <button
                  onClick={() => setIsRealtorToolsExpanded(!isRealtorToolsExpanded)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                >
                  <span className="font-semibold">Realtor Tools</span>
                  {isRealtorToolsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isRealtorToolsExpanded && (
                  <div className="pl-3 grid gap-1">
                    <NavLink href="/dashboard/mentee/tools/income-calc" icon={Calculator}>
                      Income Calculator
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