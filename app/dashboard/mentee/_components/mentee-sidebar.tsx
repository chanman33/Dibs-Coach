"use client"

import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"
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
  Bot
} from "lucide-react"

export function MenteeSidebar() {
  const pathname = usePathname()
  const [isToolsExpanded, setIsToolsExpanded] = useState(true)

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
          <Link className="flex items-center gap-2 font-semibold ml-1" href="/dashboard/mentee">
            <span>Mentee Portal</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
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
            <NavLink href="/dashboard/mentee/messages" icon={MessageSquare}>
              Messages
            </NavLink>


            {/* Coaching */}
            <NavLink href="/dashboard/mentee/browse-coaches" icon={GraduationCap}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Browse Coaches</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                  Grow
                </span>
              </div>
            </NavLink>


            {/* Shared Tools */}
            <Separator className="my-3" />
            <div className="pl-3">
              <NavLink href="/dashboard/mentee/tools/ai-agent" icon={Bot}>
                AI Agent
              </NavLink>
              <NavLink href="/dashboard/mentee/tools/ai-listings" icon={Building2}>
                AI Listing Generator
              </NavLink>
              <NavLink href="/dashboard/mentee/tools/income-calc" icon={Calculator}>
                Income Calculator
              </NavLink>
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
} 