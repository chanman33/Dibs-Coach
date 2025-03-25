"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { UserPlus, Shield, Check, X, ChevronDown, Settings, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

interface OrganizationRoleManagementProps {
  orgId: string
}

// Mock permission data
const PERMISSION_GROUPS = {
  admin: ["MANAGE_ORGANIZATION", "MANAGE_MEMBERS", "MANAGE_ROLES", "VIEW_ORG_ANALYTICS"],
  coaching: ["BOOK_SESSIONS", "APPROVE_SESSIONS", "MANAGE_BUDGETS", "VIEW_COACH_REPORTS"],
  reporting: ["VIEW_ANALYTICS", "EXPORT_REPORTS", "VIEW_MEMBER_ACTIVITY"],
  billing: ["MANAGE_PAYMENT_METHODS", "VIEW_INVOICES", "MANAGE_SUBSCRIPTION", "UPDATE_BILLING_INFO"]
}

// Mock roles data
const ORG_ROLES = [
  { 
    id: "owner", 
    name: "Organization Owner", 
    description: "Full access to all organization settings and features",
    members: 1,
    canEdit: false,
    isDefault: false,
    permissions: [...PERMISSION_GROUPS.admin, ...PERMISSION_GROUPS.coaching, ...PERMISSION_GROUPS.reporting, ...PERMISSION_GROUPS.billing]
  },
  { 
    id: "admin", 
    name: "Admin", 
    description: "Can manage members and view all organization data",
    members: 2,
    canEdit: true,
    isDefault: false,
    permissions: [...PERMISSION_GROUPS.admin, ...PERMISSION_GROUPS.reporting]
  },
  { 
    id: "billing_admin", 
    name: "Billing Admin", 
    description: "Can manage billing and payment information",
    members: 1,
    canEdit: true,
    isDefault: false,
    permissions: [...PERMISSION_GROUPS.billing, "VIEW_ORG_ANALYTICS"]
  },
  { 
    id: "manager", 
    name: "Manager", 
    description: "Can approve coaching sessions and manage team budgets",
    members: 3,
    canEdit: true,
    isDefault: false,
    permissions: ["MANAGE_MEMBERS", "APPROVE_SESSIONS", "MANAGE_BUDGETS", "VIEW_COACH_REPORTS", "VIEW_ANALYTICS"]
  },
  { 
    id: "employee", 
    name: "Employee", 
    description: "Standard member with booking permissions",
    members: 12,
    canEdit: true,
    isDefault: true,
    permissions: ["BOOK_SESSIONS", "VIEW_MEMBER_ACTIVITY"]
  }
]

// Mock members data
const MEMBERS = [
  { 
    id: "user1", 
    name: "John Smith", 
    email: "john.smith@example.com", 
    role: "owner",
    avatar: "", 
    joinedAt: "2023-01-15" 
  },
  { 
    id: "user2", 
    name: "Emma Johnson", 
    email: "emma.j@example.com", 
    role: "admin", 
    avatar: "",
    joinedAt: "2023-02-10" 
  },
  { 
    id: "user3", 
    name: "Michael Davis", 
    email: "m.davis@example.com", 
    role: "manager", 
    avatar: "",
    joinedAt: "2023-03-05" 
  },
  { 
    id: "user4", 
    name: "Sarah Wilson", 
    email: "sarah.w@example.com", 
    role: "billing_admin", 
    avatar: "",
    joinedAt: "2023-03-15" 
  },
  { 
    id: "user5", 
    name: "Robert Martin", 
    email: "r.martin@example.com", 
    role: "employee", 
    avatar: "",
    joinedAt: "2023-04-01" 
  }
]

export function OrganizationRoleManagement({ orgId }: OrganizationRoleManagementProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("members")
  const [roles, setRoles] = useState(ORG_ROLES)
  const [members, setMembers] = useState(MEMBERS)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [roleSearchTerm, setRoleSearchTerm] = useState("")
  const [memberSearchTerm, setMemberSearchTerm] = useState("")
  
  // Filter members by search term
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
    member.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
  )
  
  // Filter roles by search term
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(roleSearchTerm.toLowerCase()) || 
    role.description.toLowerCase().includes(roleSearchTerm.toLowerCase())
  )
  
  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])
  
  const handleOpenEditDialog = (role: any) => {
    setEditingRole({...role})
    setIsEditDialogOpen(true)
  }
  
  const handleSaveRole = () => {
    if (!editingRole) return
    
    setRoles(prevRoles => 
      prevRoles.map(role => 
        role.id === editingRole.id ? editingRole : role
      )
    )
    
    setIsEditDialogOpen(false)
  }
  
  const handleChangePermission = (permission: string, checked: boolean) => {
    if (!editingRole) return
    
    const updatedPermissions = checked 
      ? [...editingRole.permissions, permission]
      : editingRole.permissions.filter((p: string) => p !== permission)
    
    setEditingRole({
      ...editingRole,
      permissions: updatedPermissions
    })
  }
  
  const handleChangeUserRole = (userId: string, roleId: string) => {
    setMembers(prevMembers => 
      prevMembers.map(member => 
        member.id === userId ? {...member, role: roleId} : member
      )
    )
  }
  
  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    return role ? role.name : roleId
  }
  
  const renderSkeletonLoading = () => (
    <div className="space-y-3">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions Management
          </CardTitle>
          <CardDescription>
            Manage roles, permissions, and member access within your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="space-y-4">
              {isLoading ? (
                renderSkeletonLoading()
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div className="relative w-72">
                      <Input
                        placeholder="Search members..."
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-muted-foreground">{member.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              defaultValue={member.role} 
                              onValueChange={(value) => handleChangeUserRole(member.id, value)}
                              disabled={member.role === "owner"}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{member.joinedAt}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem disabled={member.role === "owner"}>
                                  Edit Permissions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" disabled={member.role === "owner"}>
                                  Remove from Organization
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="roles" className="space-y-4">
              {isLoading ? (
                renderSkeletonLoading()
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div className="relative w-72">
                      <Input
                        placeholder="Search roles..."
                        value={roleSearchTerm}
                        onChange={(e) => setRoleSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>Create Role</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Create New Role</DialogTitle>
                          <DialogDescription>
                            Define a new role with custom permissions.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium">
                              Role Name
                            </label>
                            <Input id="name" placeholder="Enter role name" />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="description" className="text-sm font-medium">
                              Description
                            </label>
                            <Input id="description" placeholder="Enter role description" />
                          </div>
                          
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">
                              Permissions
                            </label>
                            <div className="space-y-2">
                              {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                                <div key={group}>
                                  <h3 className="text-sm font-semibold capitalize mb-2">{group} Permissions</h3>
                                  <div className="grid grid-cols-1 gap-2">
                                    {permissions.map(permission => (
                                      <div key={permission} className="flex items-center space-x-2">
                                        <Checkbox id={permission} />
                                        <label
                                          htmlFor={permission}
                                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                          {permission.replace(/_/g, ' ').toLowerCase()}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                  {group !== Object.keys(PERMISSION_GROUPS).pop() && <Separator className="my-2" />}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create Role</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="grid gap-4">
                    {filteredRoles.map(role => (
                      <Card key={role.id} className={role.isDefault ? "border-primary/50" : ""}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {role.name}
                                {role.isDefault && <Badge variant="outline">Default</Badge>}
                              </CardTitle>
                              <CardDescription>{role.description}</CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleOpenEditDialog(role)}
                                disabled={!role.canEdit}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Members</div>
                              <div className="font-medium">{role.members}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Permissions</div>
                              <div className="font-medium">{role.permissions.length}</div>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="text-sm font-medium mb-2">Key Permissions</div>
                            <div className="flex flex-wrap gap-2">
                              {role.permissions.slice(0, 4).map(permission => (
                                <Badge key={permission} variant="secondary">
                                  {permission.split('_').slice(1).join(' ').toLowerCase()}
                                </Badge>
                              ))}
                              {role.permissions.length > 4 && (
                                <Badge variant="outline">+{role.permissions.length - 4} more</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
            <DialogDescription>
              Modify role details and permissions.
            </DialogDescription>
          </DialogHeader>
          
          {editingRole && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="role-name" className="text-sm font-medium">
                  Role Name
                </label>
                <Input 
                  id="role-name" 
                  value={editingRole.name} 
                  onChange={(e) => setEditingRole({...editingRole, name: e.target.value})} 
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="role-description" className="text-sm font-medium">
                  Description
                </label>
                <Input 
                  id="role-description" 
                  value={editingRole.description} 
                  onChange={(e) => setEditingRole({...editingRole, description: e.target.value})} 
                />
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isDefault" 
                    checked={editingRole.isDefault}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        // Uncheck other defaults
                        setRoles(prevRoles => 
                          prevRoles.map(role => ({...role, isDefault: false}))
                        )
                      }
                      setEditingRole({...editingRole, isDefault: !!checked})
                    }}
                  />
                  <label
                    htmlFor="isDefault"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Make this the default role for new members
                  </label>
                </div>
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Permissions
                </label>
                <div className="space-y-2">
                  {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                    <div key={group}>
                      <h3 className="text-sm font-semibold capitalize mb-2">{group} Permissions</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {permissions.map(permission => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-${permission}`} 
                              checked={editingRole.permissions.includes(permission)}
                              onCheckedChange={(checked) => handleChangePermission(permission, !!checked)}
                            />
                            <label
                              htmlFor={`edit-${permission}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.replace(/_/g, ' ').toLowerCase()}
                            </label>
                          </div>
                        ))}
                      </div>
                      {group !== Object.keys(PERMISSION_GROUPS).pop() && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 