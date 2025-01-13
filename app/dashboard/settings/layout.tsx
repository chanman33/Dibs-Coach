"use client"

import { ReactNode } from "react"
import { Settings, Bell, CreditCard, Calendar } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const links = [
    {
      href: "/dashboard/settings",
      label: "Account", 
      icon: Settings
    },
    {
      href: "/dashboard/settings/notifications",
      label: "Notifications",
      icon: Bell
    },
    {
      href: "/dashboard/settings/subscription", 
      label: "Subscription",
      icon: CreditCard
    },
    {
      href: "/dashboard/settings/calendly",
      label: "Calendly",
      icon: Calendar
    }
  ]

  return (
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 p-8">
      <aside className="-mx-4 lg:w-1/5">
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === link.href && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              )}
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <link.icon className="h-3 w-3" />
              </div>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  )
} 