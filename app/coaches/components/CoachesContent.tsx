"use client"

import { CoachList } from "./CoachList"
import { PageHeader } from "@/components/ui/PageHeader"
import { SearchAndFilter } from "./SearchAndFilter"
import { FeaturedCoaches } from "./FeaturedCoaches"
import { Categories } from "./Categories"
import { Pagination } from "@/components/ui/pagination"
import { SignUpCTA } from "@/components/homepage/SignUpCTA"

export function CoachesContent() {
  const handlePageChange = (page: number) => {
    // Handle pagination
    console.log("Page changed to:", page)
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto mb-8">
          <PageHeader
            title="Find Your Real Estate Coach"
            description="Browse our expert real estate coaches and book a session to accelerate your property success."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8">
          <aside>
            <div className="sticky top-8 space-y-6">
              <SearchAndFilter />
              <Categories />
            </div>
          </aside>

          <div className="flex flex-col w-full space-y-6">
            <SignUpCTA className="w-full" />
            <FeaturedCoaches />
            <CoachList />
            <div className="w-full py-4">
              <Pagination 
                currentPage={1} 
                totalPages={10} 
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 