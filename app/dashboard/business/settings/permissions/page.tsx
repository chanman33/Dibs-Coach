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
  Users,
  Edit,
  Lock,
  Plus,
  Briefcase,
  Pencil
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { RouteGuardProvider } from "@/components/auth/RouteGuardContext";

// Define types
type Role = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isSystem: boolean;
};

type Permission = {
  id: string;
  name: string;
  description: string;
  category: string;
};

type ApprovalStep = {
  role: string;
  timeframe: string;
  autoApprove: boolean;
};

type ApprovalWorkflow = {
  id: string;
  name: string;
  description: string;
  status: string;
  steps: ApprovalStep[];
  conditions: Record<string, any>;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  status: string;
  lastActive: string;
};

// Mock organization roles data
const ORGANIZATION_ROLES = {
  roles: [
    { id: "owner", name: "Organization Owner", description: "Full organization access and control", isDefault: false, isSystem: true },
    { id: "billing_admin", name: "Billing Administrator", description: "Manage subscriptions and payment methods", isDefault: false, isSystem: true },
    { id: "department_admin", name: "Department Administrator", description: "Manage department members and resources", isDefault: false, isSystem: false },
    { id: "team_lead", name: "Team Lead", description: "Manage team members and assignments", isDefault: false, isSystem: false },
    { id: "member", name: "Member", description: "Standard organization member", isDefault: true, isSystem: true }
  ],
  permissions: [
    { id: "manage_organization", name: "Manage Organization", description: "Modify organization settings and profile", category: "organization" },
    { id: "view_admin_dashboard", name: "View Admin Dashboard", description: "Access to administration dashboard", category: "organization" },
    { id: "manage_members", name: "Manage Members", description: "Add, remove, and edit members", category: "members" },
    { id: "manage_roles", name: "Manage Roles", description: "Create and assign roles to members", category: "members" },
    { id: "manage_billing", name: "Manage Billing", description: "Manage subscriptions and payment methods", category: "billing" },
    { id: "assign_seats", name: "Assign Seats", description: "Assign license seats to users", category: "billing" },
    { id: "manage_budgets", name: "Manage Budgets", description: "Create and edit budgets", category: "billing" },
    { id: "book_coaching", name: "Book Coaching", description: "Book coaching sessions", category: "coaching" },
    { id: "manage_approvals", name: "Manage Approvals", description: "Approve coaching requests", category: "coaching" },
    { id: "view_analytics", name: "View Analytics", description: "Access to organization analytics", category: "analytics" },
    { id: "export_reports", name: "Export Reports", description: "Export data and reports", category: "analytics" }
  ],
  rolePermissions: {
    owner: ["manage_organization", "view_admin_dashboard", "manage_members", "manage_roles", "manage_billing", "assign_seats", "manage_budgets", "book_coaching", "manage_approvals", "view_analytics", "export_reports"],
    billing_admin: ["view_admin_dashboard", "manage_billing", "assign_seats", "manage_budgets", "view_analytics"],
    department_admin: ["view_admin_dashboard", "manage_members", "book_coaching", "manage_approvals", "view_analytics"],
    team_lead: ["view_admin_dashboard", "manage_members", "book_coaching", "manage_approvals", "view_analytics"],
    member: ["book_coaching", "view_analytics"]
  }
};

// Mock approval workflows
const APPROVAL_WORKFLOWS: ApprovalWorkflow[] = [
  { 
    id: "coaching_approval", 
    name: "Coaching Session Approval", 
    description: "Workflow for approving coaching session requests",
    status: "active",
    steps: [
      { role: "team_lead", timeframe: "24h", autoApprove: false },
      { role: "department_admin", timeframe: "48h", autoApprove: true }
    ],
    conditions: {
      budgetThreshold: 500,
      requireApprovalAboveThreshold: true,
      autoApproveSessionTypes: ["recurring"]
    }
  },
  { 
    id: "budget_override", 
    name: "Budget Override", 
    description: "Approval process for exceeding budget limits",
    status: "active",
    steps: [
      { role: "department_admin", timeframe: "24h", autoApprove: false },
      { role: "billing_admin", timeframe: "48h", autoApprove: false }
    ],
    conditions: {
      overrideLimit: 1000,
      requireJustification: true,
      expiration: "30d"
    }
  },
  { 
    id: "new_member_access", 
    name: "New Member Access Approval", 
    description: "Streamlined access permissions for new members",
    status: "disabled",
    steps: [
      { role: "team_lead", timeframe: "24h", autoApprove: true }
    ],
    conditions: {
      automaticallyAddToTeam: true,
      grantDefaultAccess: true,
      probationPeriod: "14d"
    }
  }
];

// Mock team members
const TEAM_MEMBERS: TeamMember[] = [
  { id: "user1", name: "Alex Johnson", email: "alex@example.com", role: "owner", department: "Executive", avatar: "/avatars/01.png", status: "active", lastActive: "Today" },
  { id: "user2", name: "Sam Smith", email: "sam@example.com", role: "billing_admin", department: "Finance", avatar: "/avatars/02.png", status: "active", lastActive: "Yesterday" },
  { id: "user3", name: "Jamie Williams", email: "jamie@example.com", role: "department_admin", department: "Sales", avatar: "/avatars/03.png", status: "active", lastActive: "Yesterday" },
  { id: "user4", name: "Taylor Brown", email: "taylor@example.com", role: "team_lead", department: "Marketing", avatar: "/avatars/04.png", status: "active", lastActive: "Last week" },
  { id: "user5", name: "Morgan Lee", email: "morgan@example.com", role: "member", department: "Sales", avatar: "/avatars/05.png", status: "invited", lastActive: "Never" },
  { id: "user6", name: "Casey Jones", email: "casey@example.com", role: "member", department: "Marketing", avatar: "/avatars/06.png", status: "active", lastActive: "Today" },
  { id: "user7", name: "Jordan Rivera", email: "jordan@example.com", role: "member", department: "Sales", avatar: "/avatars/07.png", status: "active", lastActive: "Yesterday" }
];

export default function BusinessPermissionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [organizationRoles, setOrganizationRoles] = useState<Role[]>(ORGANIZATION_ROLES.roles);
  const [permissions, setPermissions] = useState<Permission[]>(ORGANIZATION_ROLES.permissions);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(ORGANIZATION_ROLES.rolePermissions);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(TEAM_MEMBERS);
  const [approvalWorkflows, setApprovalWorkflows] = useState<ApprovalWorkflow[]>(APPROVAL_WORKFLOWS);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string } | null>(null);
  const { toast } = useToast();
  
  // Filter team members by search term
  const filteredTeamMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department.toLowerCase().includes(searchTerm.toLowerCase())
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
      const rolePerm = [...(prev[roleId] || [])];
      
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
  
  const handleWorkflowStatusToggle = (workflowId: string, enabled: boolean) => {
    setApprovalWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === workflowId 
          ? { ...workflow, status: enabled ? "active" : "disabled" } 
          : workflow
      )
    );
    
    toast({
      title: enabled ? "Workflow Activated" : "Workflow Disabled",
      description: `The workflow has been ${enabled ? "activated" : "disabled"} successfully.`,
      duration: 3000
    });
  };
  
  const handleEditWorkflow = (workflow: ApprovalWorkflow) => {
    setEditingWorkflow({...workflow});
  };
  
  const handleEditMember = (member: TeamMember) => {
    setEditingMember({...member});
  };
  
  const handleDeleteConfirmation = (type: string, id: string) => {
    setItemToDelete({ type, id });
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    
    const { type, id } = itemToDelete;
    
    if (type === 'role' && id !== 'owner' && id !== 'member') {
      // Remove role from the list
      setOrganizationRoles(prev => prev.filter(role => role.id !== id));
      // Remove role permissions
      setRolePermissions(prev => {
        const newPermissions = {...prev};
        delete newPermissions[id];
        return newPermissions;
      });
      // Reset selected role if it's the one being deleted
      if (selectedRole === id) {
        setSelectedRole(null);
      }
      
      toast({
        title: "Role Deleted",
        description: "The role has been deleted successfully.",
        duration: 3000
      });
    } else if (type === 'workflow') {
      setApprovalWorkflows(prev => prev.filter(workflow => workflow.id !== id));
      
      toast({
        title: "Workflow Deleted",
        description: "The workflow has been deleted successfully.",
        duration: 3000
      });
    } else if (type === 'member') {
      setTeamMembers(prev => prev.filter(member => member.id !== id));
      
      toast({
        title: "Member Removed",
        description: "The team member has been removed successfully.",
        duration: 3000
      });
    }
    
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
  const handleSaveChanges = () => {
    toast({
      title: "Changes Saved",
      description: "Your changes have been saved successfully.",
      duration: 3000
    });
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
    <RouteGuardProvider required="business-permissions">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Organization Permissions</h1>
            <p className="text-sm text-muted-foreground">
              Manage roles, approval workflows, and member permissions
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="roles">
              <Briefcase className="h-4 w-4 mr-2" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="approvals">
              <Check className="h-4 w-4 mr-2" />
              Approval Workflows
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="roles" className="space-y-4">
            {isLoading ? (
              renderSkeletonLoading()
            ) : (
              <div className="grid md:grid-cols-12 gap-6">
                <Card className="md:col-span-4">
                  <CardHeader>
                    <CardTitle>Organization Roles</CardTitle>
                    <CardDescription>
                      Define roles for organization members
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      {organizationRoles.map(role => (
                        <button
                          key={role.id}
                          className={`flex items-center justify-between p-4 text-left border-b hover:bg-accent/50 transition-all ${selectedRole === role.id ? 'bg-accent' : ''}`}
                          onClick={() => handleRoleSelect(role.id)}
                        >
                          <div>
                            <div className="font-medium">{role.name}</div>
                            <div className="text-sm text-muted-foreground">{role.description}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {role.isDefault && <Badge variant="outline">Default</Badge>}
                            {role.isSystem && <Badge>System</Badge>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-center p-4">
                    <Button className="w-full" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Custom Role
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="md:col-span-8">
                  <CardHeader>
                    <CardTitle>Role Permissions</CardTitle>
                    <CardDescription>
                      {selectedRole 
                        ? `Manage permissions for the ${organizationRoles.find(r => r.id === selectedRole)?.name} role` 
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
                        {['organization', 'members', 'billing', 'coaching', 'analytics'].map(category => {
                          const categoryPermissions = permissions.filter(p => p.category === category);
                          if (categoryPermissions.length === 0) return null;
                          
                          return (
                            <div key={category} className="space-y-3">
                              <h3 className="font-medium capitalize">{category} Permissions</h3>
                              <div className="space-y-2">
                                {categoryPermissions.map(permission => {
                                  const hasPermission = rolePermissions[selectedRole]?.includes(permission.id);
                                  
                                  return (
                                    <div key={permission.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50">
                                      <div>
                                        <div className="font-medium">{permission.name}</div>
                                        <div className="text-sm text-muted-foreground">{permission.description}</div>
                                      </div>
                                      <Switch 
                                        checked={hasPermission}
                                        onCheckedChange={(checked) => handlePermissionToggle(selectedRole, permission.id, checked)}
                                        disabled={selectedRole === 'owner' && permission.id === 'manage_organization'}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              {category !== 'analytics' && <Separator />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                  {selectedRole && (
                    <CardFooter className="flex justify-between border-t p-4">
                      <div>
                        {selectedRole !== 'owner' && selectedRole !== 'member' && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteConfirmation('role', selectedRole)}
                          >
                            Delete Role
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">Reset Defaults</Button>
                        <Button onClick={handleSaveChanges}>Save Changes</Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="members" className="space-y-4">
            {isLoading ? (
              renderSkeletonLoading()
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search team members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Team Member
                  </Button>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members & Permissions</CardTitle>
                    <CardDescription>
                      Manage your organization's team members and their roles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team Member</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTeamMembers.map(member => (
                          <TableRow key={member.id}>
                            <TableCell className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-xs text-muted-foreground">{member.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{member.department}</TableCell>
                            <TableCell>
                              <Select defaultValue={member.role}>
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {organizationRoles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={member.status === "active" ? "default" : member.status === "invited" ? "secondary" : "outline"}
                                className="capitalize"
                              >
                                {member.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{member.lastActive}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditMember(member)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {member.id !== "user1" && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteConfirmation('member', member.id)}
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                )}
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
          
          <TabsContent value="approvals" className="space-y-4">
            {isLoading ? (
              renderSkeletonLoading()
            ) : (
              <>
                <div className="flex justify-end">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-1 gap-4">
                  {approvalWorkflows.map(workflow => (
                    <Card key={workflow.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{workflow.name}</CardTitle>
                            <CardDescription>{workflow.description}</CardDescription>
                          </div>
                          <Switch
                            checked={workflow.status === "active"}
                            onCheckedChange={(checked) => handleWorkflowStatusToggle(workflow.id, checked)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Approval Steps</h3>
                            <ol className="space-y-2">
                              {workflow.steps.map((step, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 rounded-md bg-accent/50">
                                  <div className="flex items-center justify-center rounded-full bg-primary w-6 h-6 text-xs text-primary-foreground font-bold mt-0.5">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {organizationRoles.find(r => r.id === step.role)?.name || step.role}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Timeframe: {step.timeframe} • {step.autoApprove ? "Auto-approves if no action" : "Requires explicit approval"}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Conditions</h3>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(workflow.conditions).map(([key, value], index) => (
                                <div key={index} className="p-3 rounded-md bg-accent/50">
                                  <div className="font-medium capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {typeof value === 'boolean' 
                                      ? value ? "Enabled" : "Disabled"
                                      : Array.isArray(value)
                                        ? value.join(", ")
                                        : value.toString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 border-t pt-4">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteConfirmation('workflow', workflow.id)}
                        >
                          Delete
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditWorkflow(workflow)}>
                          Edit Workflow
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {itemToDelete?.type === 'role' 
                  ? "This will delete the role and may affect users who are currently assigned to it."
                  : itemToDelete?.type === 'workflow'
                    ? "This will permanently delete this approval workflow."
                    : "This will remove the team member from your organization."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RouteGuardProvider>
  );
}
