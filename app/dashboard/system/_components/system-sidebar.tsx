"use client"

import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { SidebarOrganizationSection } from "@/components/organization/sidebar-organization-section"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import {
  Users,
  Settings,
  HomeIcon,
  ClipboardCheck,
  Shield,
  Activity,
  DollarSign,
  FileText,
  Briefcase,
  BarChart3,
  Building2,
  CreditCard,
  MessageSquareText,
} from "lucide-react"

export function SystemSidebar() {
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
    <div className="lg:block hidden border-r h-screen sticky top-0">
      <div className="flex h-full flex-col">
        <div className="flex flex-col border-b">
          {/* Portal header */}
          <div className="flex h-[55px] items-center px-3">
            <Link className="flex items-center gap-2 font-semibold ml-1" href="/dashboard/system">
              <span>System Portal</span>
            </Link>
          </div>
          
          {/* Organization Switcher - Uses the shared component */}
          <SidebarOrganizationSection />
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            {/* Overview */}
            <NavLink href="/dashboard/system" icon={HomeIcon}>
              Dashboard
            </NavLink>

            <Separator className="my-2" />
            
            {/* User Management */}
            <div className="text-xs uppercase text-gray-500 mt-2 mb-1">User Management</div>
            <NavLink href="/dashboard/system/user-mgmt" icon={Users}>
              Users Overview
            </NavLink>
            <NavLink href="/dashboard/system/coach-applications" icon={ClipboardCheck}>
              Coach Applications
            </NavLink>
            <NavLink href="/dashboard/system/coach-requests" icon={MessageSquareText}>
              Coach Requests
            </NavLink>
            <NavLink href="/dashboard/system/coach-mgmt" icon={Users}>
              Coach Management
            </NavLink>
            <NavLink href="/dashboard/system/permissions" icon={Shield}>
              Roles & Permissions
            </NavLink>

            <Separator className="my-2" />

            {/* CRM */}
            <div className="text-xs uppercase text-gray-500 mt-2 mb-1">CRM</div>
            <NavLink href="/dashboard/system/lead-mgmt" icon={Briefcase}>
              Lead Management
            </NavLink>
            <NavLink href="/dashboard/system/lead-analytics" icon={BarChart3}>
              Lead Analytics
            </NavLink>

            <Separator className="my-2" />

            {/* Organizations */}
            <div className="text-xs uppercase text-gray-500 mt-2 mb-1">Organizations</div>
            <NavLink href="/dashboard/system/organizations" icon={Building2}>
              Manage Organizations
            </NavLink>

            <Separator className="my-2" />

            {/* Analytics */}
            <div className="text-xs uppercase text-gray-500 mt-2 mb-1">Analytics</div>
            <NavLink href="/dashboard/system/analytics/revenue" icon={DollarSign}>
              Revenue Analytics
            </NavLink>
            {/* <NavLink href="/dashboard/system/analytics/reports" icon={FileText}>
              Reports
            </NavLink> */}

            <Separator className="my-2" />

            {/* Billing */}
            <div className="text-xs uppercase text-gray-500 mt-2 mb-1">Billing</div>
            <NavLink href="/dashboard/system/billing" icon={CreditCard}>
              Billing Management
            </NavLink>

            <Separator className="my-2" />

            {/* System */}
            <div className="text-xs uppercase text-gray-500 mt-2 mb-1">System</div>
            <NavLink href="/dashboard/system/monitoring" icon={Activity}>
              System Health
            </NavLink>

          </nav>
        </div>
      </div>
    </div>
  )
}
