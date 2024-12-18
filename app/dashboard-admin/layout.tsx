import { ReactNode } from "react"
import AdminSidebar from "./_components/admin-sidebar"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminSidebar />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {children}
      </main>
    </>
  )
} 