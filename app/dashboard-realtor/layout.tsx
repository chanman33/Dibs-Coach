import { ReactNode } from "react"
import RealtorSidebar from "./_components/realtor-sidebar"

export default function RealtorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <RealtorSidebar />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {children}
      </main>
    </>
  )
} 