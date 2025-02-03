"use client"

import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import {
  Users,
  Settings,
  HomeIcon,
  UserCircle,
  ClipboardCheck,
} from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()

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
          <Link className="flex items-center gap-2 font-semibold ml-1" href="/dashboard/admin">
            <span>Admin Portal</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {/* Main Navigation */}
            <NavLink href="/dashboard/admin" icon={HomeIcon}>
              Dashboard
            </NavLink>
            <NavLink href="/dashboard/admin/profile" icon={UserCircle}>
              Profile
            </NavLink>

            <Separator className="my-3" />
            
            {/* Admin Features */}
            <NavLink href="/dashboard/admin/users" icon={Users}>
              User Management
            </NavLink>
            <NavLink href="/dashboard/admin/settings" icon={Settings}>
              System Settings
            </NavLink>
            <NavLink href="/dashboard/admin/coach-applications" icon={ClipboardCheck}>
              Coach Applications
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  )
} 