"use client"

import { Separator } from "@/components/ui/separator"
import clsx from "clsx"
import { Users, CalendarDays, HomeIcon, MessageSquare, Settings, ClipboardList, UserCircle, BarChart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function CoachSidebar() {
  const pathname = usePathname()

  return (
    <div className="lg:block hidden border-r h-full">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[55px] items-center justify-between border-b px-3 w-full">
          <Link className="flex items-center gap-2 font-semibold ml-1" href="/dashboard/coach">
            <span>Coach Portal</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <Link
              className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50", {
                "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50": pathname === "/dashboard/coach"
              })}
              href="/dashboard/coach"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <HomeIcon className="h-3 w-3" />
              </div>
              Dashboard
            </Link>
            <Link
              href="/dashboard/coach/profile"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard/coach/profile" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <UserCircle className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/dashboard/coach/calendar"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard/coach/calendar" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Link>
            <Link
              href="/dashboard/coach/crm"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard/coach/crm" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <Users className="h-4 w-4" />
              Clients
            </Link>
            <Link
              href="/dashboard/coach/sessions"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard/coach/sessions" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              Sessions
            </Link>
            <Link
              href="/dashboard/coach/analytics"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard/coach/analytics" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <BarChart className="h-4 w-4" />
              Analytics
            </Link>
            <Link
              href="/dashboard/coach/messages"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard/coach/messages" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>
            <Separator className="my-3" />
          </nav>
        </div>
      </div>
    </div>
  )
} 