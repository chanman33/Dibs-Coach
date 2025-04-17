'use client';

import { useOrganization } from "@/utils/auth/OrganizationContext";
import { cn } from "@/utils/cn";
import { 
  Building, 
  Building2, 
  ChevronsUpDown, 
  LucideIcon, 
  Network, 
  LayoutGrid,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrganizationMember } from "@/utils/auth/OrganizationContext";

// Map organization types to icons
const orgTypeIcons: Record<string, LucideIcon> = {
  INDIVIDUAL: Building,
  TEAM: Users2,
  BUSINESS: Building2,
  ENTERPRISE: Building2,
  FRANCHISE: Network,
  NETWORK: Network,
};

// Map org roles to display names
const roleDisplayNames: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function OrganizationSwitcher() {
  const orgContext = useOrganization();
  const router = useRouter();

  if (!orgContext || orgContext.isLoading) {
    return <OrganizationSwitcherSkeleton />;
  }

  const { 
    organizationUlid, 
    setOrganizationUlid, 
    organizationName, 
    organizationRole,
    organizations
  } = orgContext;

  if (!organizations || organizations.length === 0) {
    return (
      <div className="w-full">
        <Button 
          variant="outline" 
          className="w-full justify-between text-muted-foreground"
          onClick={() => router.push('/dashboard/settings?tab=organizations')}
        >
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="text-sm">No organizations</span>
          </div>
          <Link href="/dashboard/settings?tab=organizations" prefetch={false} className="text-xs hover:underline">
            Create one?
          </Link>
        </Button>
      </div>
    );
  }

  const handleSelect = (orgId: string) => {
    setOrganizationUlid(orgId);
  };

  const currentOrgType = organizations.find((org: OrganizationMember) => org.organizationUlid === organizationUlid)?.organization.type || 'BUSINESS';
  const OrgIcon = orgTypeIcons[currentOrgType] || Building;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-56 justify-between">
          <div className="flex items-center gap-2 max-w-[180px] overflow-hidden">
            <OrgIcon className="h-4 w-4" />
            <span className="truncate">
              {organizationName || "Select Organization"}
            </span>
            {organizationRole && (
              <span className="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                {roleDisplayNames[organizationRole] || organizationRole}
              </span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>My Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {organizations.map((org: OrganizationMember) => {
            const OrgTypeIcon = orgTypeIcons[org.organization.type] || Building;
            return (
              <DropdownMenuItem
                key={org.organizationUlid}
                onClick={() => handleSelect(org.organizationUlid)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  org.organizationUlid === organizationUlid &&
                    "bg-accent"
                )}
              >
                <OrgTypeIcon className="h-4 w-4" />
                <span className="truncate flex-1">{org.organization.name}</span>
                <span className="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                  {roleDisplayNames[org.role] || org.role}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrganizationSwitcherSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-56" />
    </div>
  );
} 