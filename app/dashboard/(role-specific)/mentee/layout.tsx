import { UnifiedSidebar } from "@/app/dashboard/_components/unified-sidebar";
import { auth } from "@clerk/nextjs/server";
import { getUserRoles } from "@/utils/roles/checkUserRole";
import { ROLES, hasAnyRole } from "@/utils/roles/roles";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";

export default async function MenteeLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const roles = await getUserRoles(userId);
  if (!hasAnyRole(roles, [ROLES.MENTEE])) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen">
      <UnifiedSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 