'use client';

import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { useOrganization } from "@/utils/auth/OrganizationContext";

/**
 * A component that renders the organization switcher in a sidebar with proper handling
 * for cases when there are no organizations or when it's loading
 */
export function SidebarOrganizationSection() {
  const orgContext = useOrganization(); // Get full context
  
  // Handle loading or undefined context
  if (!orgContext || orgContext.isLoading) {
    // Optional: Render a skeleton/loading state here if desired
    return null; // Or return a loading placeholder
  }
  
  // Destructure after checks
  const { organizations } = orgContext;
  
  // Don't render anything if there are no organizations
  if (!organizations || organizations.length === 0) {
    return null;
  }
  
  return (
    <div className="px-4 py-2 border-t">
      <OrganizationSwitcher />
    </div>
  );
} 