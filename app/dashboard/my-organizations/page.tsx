'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/utils/auth/OrganizationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building, 
  Building2, 
  Search, 
  Users2,
  Network,
  ArrowRight,
  Check
} from 'lucide-react';
import Link from 'next/link';

// Map organization types to icons and colors
const orgTypeConfig: Record<string, { icon: any, color: string }> = {
  INDIVIDUAL: { icon: Building, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  TEAM: { icon: Users2, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  BUSINESS: { icon: Building2, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  ENTERPRISE: { icon: Building2, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  FRANCHISE: { icon: Network, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  NETWORK: { icon: Network, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

// Map org roles to display names and colors
const roleConfig: Record<string, { label: string, color: string }> = {
  OWNER: { label: 'Owner', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  MANAGER: { label: 'Manager', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  MEMBER: { label: 'Member', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  VIEWER: { label: 'Viewer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
};

// Map org status to colors
const statusConfig: Record<string, { color: string }> = {
  ACTIVE: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  INACTIVE: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  SUSPENDED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  ARCHIVED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function MyOrganizationsPage() {
  const { organizations, organizationUlid, setOrganizationUlid, isLoading } = useOrganization();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Filter organizations by search term and tab
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.organization.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && org.organization.status === 'ACTIVE') ||
      (activeTab === 'owner' && org.role === 'OWNER') ||
      (activeTab === 'member' && org.role === 'MEMBER');
    
    return matchesSearch && matchesTab;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Organizations</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-6">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex items-center gap-2 mt-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex justify-between">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">My Organizations</h1>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full sm:w-[250px]"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="owner">Owner</TabsTrigger>
          <TabsTrigger value="member">Member</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {filteredOrganizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No organizations found</h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm 
                  ? `No organizations matching '${searchTerm}'` 
                  : 'You have no organizations in this category'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrganizations.map((org) => {
                const OrgIcon = orgTypeConfig[org.organization.type]?.icon || Building;
                const typeColor = orgTypeConfig[org.organization.type]?.color || '';
                const roleConfig_ = roleConfig[org.role] || { label: org.role, color: '' };
                const statusColor = statusConfig[org.organization.status]?.color || '';
                const isActive = org.organizationUlid === organizationUlid;

                return (
                  <Card key={org.organizationUlid} className={`overflow-hidden transition-all hover:shadow-md ${isActive ? 'border-primary' : ''}`}>
                    <CardHeader className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-full ${typeColor}`}>
                            <OrgIcon className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-xl truncate max-w-[180px]">
                            {org.organization.name}
                          </CardTitle>
                        </div>
                        {isActive && (
                          <Badge variant="outline" className="gap-1 border-primary text-primary">
                            <Check className="h-3 w-3" /> Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className={roleConfig_.color}>
                          {roleConfig_.label}
                        </Badge>
                        <Badge variant="secondary" className={statusColor}>
                          {org.organization.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="text-sm text-muted-foreground mt-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span>Type:</span>
                            <span className="font-medium">{org.organization.type}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Tier:</span>
                            <span className="font-medium">{org.organization.tier}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Joined:</span>
                            <span className="font-medium">{formatDate(org.joinedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 pt-0 flex justify-between">
                      <Button
                        variant={isActive ? "secondary" : "default"}
                        className="text-sm"
                        onClick={() => setOrganizationUlid(org.organizationUlid)}
                      >
                        {isActive ? 'Current Context' : 'Switch Context'}
                      </Button>
                      <Button variant="outline" className="ml-auto text-sm" asChild>
                        <Link href={`/dashboard/organizations/${org.organizationUlid}`}>
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 