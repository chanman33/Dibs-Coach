"use client"

import { Separator } from "@/components/ui/separator"
import clsx from "clsx"
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Shield, 
  Settings,
  FileText,
  ActivitySquare
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="lg:block hidden border-r h-full">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[55px] items-center justify-between border-b px-3 w-full">
          <Link className="flex items-center gap-2 font-semibold ml-1" href="/dashboard-admin">
            <Shield className="h-5 w-5" />
            <span>Admin Portal</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <Link
              className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50", {
                "flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50": pathname === "/dashboard-admin"
              })}
              href="/dashboard-admin"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <LayoutDashboard className="h-3 w-3" />
              </div>
              Dashboard
            </Link>
            <Link
              href="/dashboard-admin/users"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard-admin/users" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <Users className="h-4 w-4" />
              User Management
            </Link>
            <Link
              href="/dashboard-admin/properties"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard-admin/properties" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <Building2 className="h-4 w-4" />
              Properties
            </Link>
            <Link
              href="/dashboard-admin/reports"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard-admin/reports" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <FileText className="h-4 w-4" />
              Reports
            </Link>
            <Link
              href="/dashboard-admin/activity"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard-admin/activity" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <ActivitySquare className="h-4 w-4" />
              Activity Logs
            </Link>
            <Separator className="my-3" />
            <Link
              href="/dashboard-admin/settings"
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === "/dashboard-admin/settings" && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
} 