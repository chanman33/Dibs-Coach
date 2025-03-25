"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Check,
  Shield,
  Settings,
  Users,
  Edit,
  Lock,
  AlertTriangle,
  Save,
  Plus
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Mock permission data
const SYSTEM_PERMISSIONS = {
  roles: [
    { id: "system_owner", name: "System Owner", description: "Full system access", isDefault: false, isSystem: true },
    { id: "system_admin", name: "System Administrator", description: "Full management access with some restrictions", isDefault: false, isSystem: true },
    { id: "billing_admin", name: "Billing Administrator", description: "Manage plans and organization billing", isDefault: false, isSystem: true },
    { id: "support_admin", name: "Support Administrator", description: "Customer support access", isDefault: false, isSystem: true }
  ],
  permissions: [
    { id: "manage_system", name: "Manage System", description: "Full system management", category: "system" },
    { id: "view_admin_dashboard", name: "View Admin Dashboard", description: "Access to admin dashboard", category: "system" },
    { id: "manage_organizations", name: "Manage Organizations", description: "Create and manage organizations", category: "organization" },
    { id: "manage_users", name: "Manage Users", description: "User management capabilities", category: "user" },
    { id: "manage_billing", name: "Manage Billing", description: "Billing and subscription management", category: "billing" },
    { id: "manage_plans", name: "Manage Plans", description: "Create and edit subscription plans", category: "billing" },
    { id: "support_access", name: "Support Access", description: "Customer support tools access", category: "support" },
    { id: "system_logs", name: "System Logs", description: "View system logs and activity", category: "system" }
  ],
  rolePermissions: {
    system_owner: ["manage_system", "view_admin_dashboard", "manage_organizations", "manage_users", "manage_billing", "manage_plans", "support_access", "system_logs"],
    system_admin: ["view_admin_dashboard", "manage_organizations", "manage_users", "support_access", "system_logs"],
    billing_admin: ["view_admin_dashboard", "manage_billing", "manage_plans"],
    support_admin: ["view_admin_dashboard", "support_access"]
  }
};

// Mock organization role templates
const ORGANIZATION_ROLE_TEMPLATES = [
  { 
    id: "default", 
    name: "Default Template", 
    description: "Standard roles for new organizations",
    isDefault: true,
    roles: [
      { id: "owner", name: "Organization Owner", description: "Full organization access", isDefault: false },
      { id: "admin", name: "Admin", description: "Organization administration", isDefault: false },
      { id: "manager", name: "Manager", description: "Department management", isDefault: false },
      { id: "member", name: "Member", description: "Standard organization member", isDefault: true }
    ]
  },
  { 
    id: "enterprise", 
    name: "Enterprise Template", 
    description: "Extended roles for enterprise organizations",
    isDefault: false,
    roles: [
      { id: "owner", name: "Organization Owner", description: "Full organization access", isDefault: false },
      { id: "admin", name: "Admin", description: "Organization administration", isDefault: false },
      { id: "billing_admin", name: "Billing Admin", description: "Billing management only", isDefault: false },
      { id: "department_head", name: "Department Head", description: "Department leadership", isDefault: false },
      { id: "team_lead", name: "Team Lead", description: "Team management", isDefault: false },
      { id: "member", name: "Member", description: "Standard organization member", isDefault: true }
    ]
  }
];

// Mock permission policies
const SYSTEM_POLICIES = [
  { 
    id: "password_policy", 
    name: "Password Policy", 
    status: "enabled",
    settings: {
      minLength: 10,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expiresDays: 90
    }
  },
  { 
    id: "session_policy", 
    name: "Session Policy", 
    status: "enabled",
    settings: {
      sessionTimeout: 60, // minutes
      maxConcurrentSessions: 3,
      enforceDeviceLimit: true,
      requireReauthForSensitive: true
    }
  },
  { 
    id: "api_access_policy", 
    name: "API Access Policy", 
    status: "enabled",
    settings: {
      rateLimitPerMinute: 100,
      requireOAuth: true,
      tokenExpirationHours: 24,
      logAllRequests: true
    }
  }
];

// Mock admin users
const ADMIN_USERS = [
  { id: "user1", name: "Alex Johnson", email: "alex@example.com", role: "system_owner", status: "active", lastActive: "2023-05-01" },
  { id: "user2", name: "Sam Smith", email: "sam@example.com", role: "system_admin", status: "active", lastActive: "2023-05-10" },
  { id: "user3", name: "Jamie Williams", email: "jamie@example.com", role: "billing_admin", status: "active", lastActive: "2023-05-05" },
  { id: "user4", name: "Taylor Brown", email: "taylor@example.com", role: "support_admin", status: "inactive", lastActive: "2023-04-20" }
];

export default function SystemPermissionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [systemRoles, setSystemRoles] = useState(SYSTEM_PERMISSIONS.roles);
  const [permissions, setPermissions] = useState(SYSTEM_PERMISSIONS.permissions);
  const [rolePermissions, setRolePermissions] = useState(SYSTEM_PERMISSIONS.rolePermissions);
  const [adminUsers, setAdminUsers] = useState(ADMIN_USERS);
  const [orgRoleTemplates, setOrgRoleTemplates] = useState(ORGANIZATION_ROLE_TEMPLATES);
  const [systemPolicies, setSystemPolicies] = useState(SYSTEM_POLICIES);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  
  // Filter admin users by search term
  const filteredAdminUsers = adminUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };
  
  const handlePermissionToggle = (roleId: string, permissionId: string, enabled: boolean) => {
    setRolePermissions(prev => {
      const rolePerm = [...(prev[roleId as keyof typeof prev] || [])];
      
      if (enabled) {
        if (!rolePerm.includes(permissionId)) {
          rolePerm.push(permissionId);
        }
      } else {
        const index = rolePerm.indexOf(permissionId);
        if (index !== -1) {
          rolePerm.splice(index, 1);
        }
      }
      
      return { ...prev, [roleId]: rolePerm };
    });
  };
  
  const handleEditTemplate = (template: any) => {
    setEditingTemplate({...template});
  };
  
  const handleSetDefaultTemplate = (templateId: string) => {
    setOrgRoleTemplates(prev => 
      prev.map(template => ({
        ...template,
        isDefault: template.id === templateId
      }))
    );
  };
  
  const handlePolicyToggle = (policyId: string, enabled: boolean) => {
    setSystemPolicies(prev => 
      prev.map(policy => 
        policy.id === policyId 
          ? { ...policy, status: enabled ? "enabled" : "disabled" } 
          : policy
      )
    );
  };
  
  const renderSkeletonLoading = () => (
    <div className="space-y-3">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Permissions</h1>
          <p className="text-sm text-muted-foreground">
            Manage system roles, permission policies, and organization defaults
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">System Roles</TabsTrigger>
          <TabsTrigger value="admins">Admin Users</TabsTrigger>
          <TabsTrigger value="templates">Organization Templates</TabsTrigger>
          <TabsTrigger value="policies">System Policies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <div className="grid md:grid-cols-12 gap-6">
              <Card className="md:col-span-4">
                <CardHeader>
                  <CardTitle>System Roles</CardTitle>
                  <CardDescription>
                    Define roles for system administrators
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    {systemRoles.map(role => (
                      <button
                        key={role.id}
                        className={`flex items-center justify-between p-4 text-left border-b hover:bg-accent/50 transition-all ${selectedRole === role.id ? 'bg-accent' : ''}`}
                        onClick={() => handleRoleSelect(role.id)}
                      >
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                        {role.isSystem && <Badge>System</Badge>}
                      </button>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center p-4">
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                </CardFooter>
              </Card>

              <Card className="md:col-span-8">
                <CardHeader>
                  <CardTitle>Role Permissions</CardTitle>
                  <CardDescription>
                    {selectedRole 
                      ? `Manage permissions for the ${systemRoles.find(r => r.id === selectedRole)?.name} role` 
                      : "Select a role to manage its permissions"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedRole ? (
                    <div className="flex flex-col items-center justify-center h-60 text-center">
                      <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No Role Selected</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Select a role from the left to view and edit its permissions
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {['system', 'organization', 'user', 'billing', 'support'].map(category => {
                        const categoryPermissions = permissions.filter(p => p.category === category);
                        if (categoryPermissions.length === 0) return null;
                        
                        return (
                          <div key={category} className="space-y-3">
                            <h3 className="font-medium capitalize">{category} Permissions</h3>
                            <div className="space-y-2">
                              {categoryPermissions.map(permission => {
                                const hasPermission = rolePermissions[selectedRole as keyof typeof rolePermissions]?.includes(permission.id);
                                
                                return (
                                  <div key={permission.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50">
                                    <div>
                                      <div className="font-medium">{permission.name}</div>
                                      <div className="text-sm text-muted-foreground">{permission.description}</div>
                                    </div>
                                    <Switch 
                                      checked={hasPermission}
                                      onCheckedChange={(checked) => handlePermissionToggle(selectedRole, permission.id, checked)}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            {category !== 'support' && <Separator />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
                {selectedRole && (
                  <CardFooter className="flex justify-end gap-2 border-t p-4">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="admins" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div className="relative w-72">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search admin users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin User
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Administrator Users</CardTitle>
                  <CardDescription>
                    Users with system-level administrative privileges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdminUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Select defaultValue={user.role}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {systemRoles.map(role => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.status === "active" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.lastActive}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Lock className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <>
              <div className="flex justify-end">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {orgRoleTemplates.map(template => (
                  <Card key={template.id} className={template.isDefault ? "border-primary" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{template.name}</CardTitle>
                        {template.isDefault && <Badge>Default</Badge>}
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium text-sm mb-2">Included Roles</h3>
                      <div className="space-y-2">
                        {template.roles.map(role => (
                          <div key={role.id} className="flex items-center justify-between p-2 rounded-md bg-accent/50">
                            <div>
                              <div className="font-medium">{role.name}</div>
                              <div className="text-xs text-muted-foreground">{role.description}</div>
                            </div>
                            {role.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between gap-2 border-t pt-4">
                      <div>
                        {!template.isDefault && (
                          <Button variant="outline" size="sm" onClick={() => handleSetDefaultTemplate(template.id)}>
                            Set as Default
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                          Edit Template
                        </Button>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="policies" className="space-y-4">
          {isLoading ? (
            renderSkeletonLoading()
          ) : (
            <div className="grid md:grid-cols-1 gap-4">
              {systemPolicies.map(policy => (
                <Card key={policy.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{policy.name}</CardTitle>
                      <Switch
                        checked={policy.status === "enabled"}
                        onCheckedChange={(checked) => handlePolicyToggle(policy.id, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {Object.entries(policy.settings).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <Label className="mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                          {typeof value === 'boolean' ? (
                            <Switch checked={value} />
                          ) : (
                            <Input type="text" value={value} />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline">Reset Defaults</Button>
                    <Button>Save Changes</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
