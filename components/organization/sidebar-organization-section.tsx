'use client';

import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { useOrganization } from "@/utils/auth/OrganizationContext";

/**
 * A component that renders the organization switcher in a sidebar with proper handling
 * for cases when there are no organizations or when it's loading
 */
export function SidebarOrganizationSection() {
  const { organizations, isLoading } = useOrganization();
  
  // Don't render anything if there are no organizations and not loading
  if (!isLoading && (!organizations || organizations.length === 0)) {
    return null;
  }
  
  return (
    <div className="px-4 py-2 border-t">
      <OrganizationSwitcher />
    </div>
  );
} 