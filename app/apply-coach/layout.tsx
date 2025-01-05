import { ReactNode } from "react";
import DashboardTopNav from "../dashboard/_components/dashboard-top-nav";

export default function ApplyCoachLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardTopNav>{children}</DashboardTopNav>
    </div>
  );
} 