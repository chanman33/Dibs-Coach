import Navbar from "@/components/wrapper/navbar";
import React from "react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      {/* TODO: Add Marketing Footer here if applicable */}
    </div>
  );
} 