"use client"

import ModeToggle from '@/components/mode-toggle'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { UserProfile } from '@/components/user-profile'
import config from '@/config'
import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'


// Add this import
import { SystemSidebar } from '@/app/dashboard/system/_components/system-sidebar'
import { CoachSidebar } from '@/app/dashboard/coach/_components/coach-sidebar'
import { MenteeSidebar } from '../mentee/_components/mentee-sidebar'

export default function DashboardTopNav({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Update getSidebarContent to handle admin case
  const getSidebarContent = () => {
    if (pathname.startsWith('/dashboard/system')) {
      return <SystemSidebar />
    }
    if (pathname.startsWith('/dashboard/coach')) {
      return <CoachSidebar />
    }
    if (pathname.startsWith('/dashboard/mentee')) {
      return <MenteeSidebar />
    }
    return null

  }

  // Update getPortalTitle to include admin case
  const getPortalTitle = () => {
    if (pathname.startsWith('/dashboard/system')) {
      return 'System Portal'
    }
    if (pathname.startsWith('/dashboard/mentee')) {
      return 'Mentee Portal'
    }
    if (pathname.startsWith('/dashboard/coach')) {
      return 'Coach Portal'
    }
    return 'Dashboard'
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-14 lg:h-[55px] items-center gap-4 border-b px-3">
        {/* Mobile View */}
        <div className="flex items-center lg:hidden w-full">
          {/* Left side - Hamburger */}
          <Sheet>
            <SheetTrigger className="p-2 transition">
              <HamburgerMenuIcon />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="flex h-[55px] items-center border-b px-6">
                <SheetTitle>{getPortalTitle()}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-auto">
                <div className="block [&>div]:block [&>div]:border-0">
                  {getSidebarContent()}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Centered Logo - Using absolute positioning */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/dashboard">
              <Image
                src="https://utfs.io/f/vsxOYx8jne165wyeoiHgeTEz7hN19sBwDyrvKxioc2kQLnp3"
                alt="Logo"
                width={80}
                height={20}
                className="object-contain dark:hidden"
                priority
              />
              <Image
                src="https://utfs.io/f/vsxOYx8jne16qkQqNfjFkTQhZ97v4VpUzm85MASd0nWRBi3J"
                alt="Logo"
                width={80}
                height={20}
                className="object-contain hidden dark:block"
                priority
              />
            </Link>
          </div>

          {/* Right side items */}
          <div className="flex justify-end items-center gap-2 ml-auto">
            {config?.auth?.enabled && <UserProfile />}
            <ModeToggle />
          </div>
        </div>

        {/* Desktop View - Logo on left */}
        <div className="hidden lg:flex items-center">
          <Link href="/dashboard">
            <Image
              src="https://utfs.io/f/vsxOYx8jne165wyeoiHgeTEz7hN19sBwDyrvKxioc2kQLnp3"
              alt="Logo"
              width={80}
              height={20}
              className="object-contain dark:hidden"
              priority
            />
            <Image
              src="https://utfs.io/f/vsxOYx8jne16qkQqNfjFkTQhZ97v4VpUzm85MASd0nWRBi3J"
              alt="Logo"
              width={80}
              height={20}
              className="object-contain hidden dark:block"
              priority
            />
          </Link>
        </div>

        {/* Desktop Right side items */}
        <div className="hidden lg:flex justify-center items-center gap-2 ml-auto">
          {config?.auth?.enabled && <UserProfile />}
          <ModeToggle />
        </div>
      </header>
      {children}
    </div>
  )
}
