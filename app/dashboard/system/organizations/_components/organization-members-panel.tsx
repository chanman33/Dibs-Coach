"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, UserPlus, Search, MoreHorizontal, UserMinus, UserCog, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ORG_ROLES } from '@/utils/roles/roles'
import { fetchOrganizationMembers, addOrganizationMember, updateOrganizationMember, removeOrganizationMember, checkUserExistsByEmail } from '@/utils/actions/organization-actions'
import { generateUlid } from '@/utils/ulid'
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface OrganizationMembersData {
  ulid: string;
  userUlid: string;
  organizationUlid: string;
  role: string;
  scope?: string | null;
  status: string;
  customPermissions?: any | null;
  metadata?: any | null;
  createdAt: string;
  updatedAt?: string;
  user: {
    ulid: string;
    name: string;
    email: string;
    imageUrl?: string | null;
  };
}

interface OrganizationMembersPanelProps {
  orgId: string
}

export function OrganizationMembersPanel({ orgId }: OrganizationMembersPanelProps) {
  const { toast } = useToast()
  const [members, setMembers] = useState<OrganizationMembersData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<OrganizationMembersData | null>(null)
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)
  const [emailValidation, setEmailValidation] = useState<{ valid: boolean; message: string; checking: boolean }>({ valid: true, message: '', checking: false })
  const [existingMembers, setExistingMembers] = useState<string[]>([])

  // Keep track of existing member emails for validation
  useEffect(() => {
    const memberEmails = members.map(member => member.user.email.toLowerCase());
    setExistingMembers(memberEmails);
  }, [members]);

  // Validate email input
  const validateEmail = async (email: string) => {
    if (!email) return;
    
    try {
      setEmailValidation(prev => ({ ...prev, checking: true }));
      
      // Check if email belongs to an existing member
      const normalizedEmail = email.toLowerCase().trim();
      if (existingMembers.includes(normalizedEmail)) {
        setEmailValidation({
          valid: false,
          message: 'This user is already a member of this organization',
          checking: false
        });
        return;
      }
      
      // Check if the user exists in the system
      const result = await checkUserExistsByEmail(email);
      
      if (result.error) {
        setEmailValidation({
          valid: false,
          message: 'Unable to verify the user. Please try again.',
          checking: false
        });
      } else if (!result.exists) {
        setEmailValidation({
          valid: false,
          message: 'No user account exists with this email',
          checking: false
        });
      } else {
        setEmailValidation({
          valid: true,
          message: `Found user: ${result.user?.name}`,
          checking: false
        });
      }
    } catch (error) {
      console.error('[EMAIL_VALIDATION_ERROR]', error);
      setEmailValidation({
        valid: false,
        message: 'Error checking user. Please try again.',
        checking: false
      });
    }
  };

  // Initial load
  useEffect(() => {
    loadMembers()
  }, [orgId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      console.log('[LOAD_MEMBERS] Loading members for organization:', orgId)
      
      const result = await fetchOrganizationMembers(orgId)

      if (result.error) {
        console.error('[FETCH_MEMBERS_ERROR_DETAILS]', { 
          orgId,
          error: result.error
        })
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
        return
      }

      console.log('[MEMBERS_LOADED]', { 
        count: result.data?.length || 0,
        orgId
      })
      
      const parsedMembers = parseMembers(result.data || [])
      setMembers(parsedMembers)
    } catch (err) {
      console.error('[FETCH_MEMBERS_ERROR]', err)
      toast({
        title: 'Error',
        description: 'Failed to load organization members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to parse API response data into the correct format
  const parseMembers = (apiMembers: any[]): OrganizationMembersData[] => {
    return apiMembers.map(member => ({
      ulid: member.ulid,
      userUlid: member.userUlid,
      organizationUlid: member.organizationUlid,
      role: member.role || 'MEMBER',
      scope: member.scope || undefined,
      status: member.status || 'ACTIVE',
      customPermissions: member.customPermissions || undefined,
      metadata: member.metadata || undefined,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt || undefined,
      user: member.user ? {
        ulid: member.user.ulid,
        name: member.user.name || `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown User',
        email: member.user.email,
        imageUrl: member.user.imageUrl === null ? undefined : member.user.imageUrl
      } : {
        ulid: member.userUlid,
        name: 'Unknown User',
        email: 'unknown@example.com'
      }
    }))
  }

  // Filter members based on search term
  const filteredMembers = members.filter(member => 
    member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Add Member Form Schema
  const addMemberSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.string().min(1, 'Role is required')
  })

  const addMemberForm = useForm<z.infer<typeof addMemberSchema>>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: '',
      role: 'MEMBER'
    }
  })

  // Edit Member Form Schema
  const editMemberSchema = z.object({
    role: z.string().min(1, 'Role is required'),
    status: z.string().min(1, 'Status is required')
  })

  const editMemberForm = useForm<z.infer<typeof editMemberSchema>>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      role: '',
      status: ''
    }
  })

  // Set edit form values when a member is selected for editing
  useEffect(() => {
    if (editingMember) {
      editMemberForm.reset({
        role: editingMember.role,
        status: editingMember.status
      })
    }
  }, [editingMember, editMemberForm])

  // Handle adding a new member
  const handleAddMember = async (data: z.infer<typeof addMemberSchema>) => {
    try {
      // Trim the email to avoid whitespace issues
      const email = data.email.trim()
      
      // Validate the email exists first
      if (!emailValidation.valid) {
        toast({
          title: 'Invalid email',
          description: emailValidation.message || 'Please use a valid email address for an existing user',
          variant: 'destructive'
        })
        return
      }
      
      // Check again if the user exists before proceeding
      setProcessingAction(true)
      const checkResult = await checkUserExistsByEmail(email)
      
      if (!checkResult.exists) {
        setEmailValidation({
          valid: false,
          message: 'No user account exists with this email',
          checking: false
        })
        
        toast({
          title: 'User not found',
          description: `No user account exists with email "${email}". Users must create an account before they can be added to an organization.`,
          variant: 'destructive'
        })
        setProcessingAction(false)
        return
      }
      
      console.log('[ADD_MEMBER] Attempting to add member:', email, 'to organization:', orgId)
      
      // Generate ULID for new member
      const ulid = generateUlid()
      
      // Try to add the organization member
      const result = await addOrganizationMember({
        ulid,
        organizationUlid: orgId,
        email,
        role: data.role,
        status: 'ACTIVE'
      }).catch(error => {
        // Handle any unexpected errors from the API call
        console.error('[ADD_MEMBER_API_CALL_ERROR]', error)
        return { 
          error: 'Failed to communicate with the server. Please try again.', 
          data: null 
        }
      })
      
      // Handle API response errors
      if (result.error) {
        console.error('[ADD_MEMBER_ERROR_DETAILS]', {
          email,
          orgId,
          role: data.role,
          errorMessage: result.error
        })
        
        let errorMessage = result.error
        
        // Provide more user-friendly message for common errors
        if (result.error === 'User not found with this email') {
          errorMessage = `No user account exists with email "${email}". Users must create an account before they can be added to an organization.`
        } else if (result.error === 'User is already a member of this organization') {
          errorMessage = `${email} is already a member of this organization.`
        } else if (result.error.includes('Failed to')) {
          errorMessage = `${result.error} Please check your connection and try again.`
        }
        
        toast({
          title: 'Error adding member',
          description: errorMessage,
          variant: 'destructive'
        })
        return
      }
      
      // Success case
      console.log('[MEMBER_ADDED]', { 
        email, 
        orgId,
        role: data.role,
        memberUlid: result.data?.ulid 
      })
      
      toast({
        title: 'Member added',
        description: `${email} has been added to the organization.`,
      })
      
      setAddDialogOpen(false)
      addMemberForm.reset()
      loadMembers()
    } catch (error) {
      // Catch any unexpected errors in our own code
      console.error('[ADD_MEMBER_UNEXPECTED_ERROR]', error)
      
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while adding the member. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Handle updating a member
  const handleUpdateMember = async (data: z.infer<typeof editMemberSchema>) => {
    if (!editingMember) return
    
    try {
      setProcessingAction(true)
      console.log('[UPDATE_MEMBER] Updating member:', editingMember.user.name, 'in organization:', orgId)
      
      const result = await updateOrganizationMember({
        memberUlid: editingMember.ulid,
        organizationUlid: editingMember.organizationUlid,
        userUlid: editingMember.userUlid,
        role: data.role,
        status: data.status
      })
      
      if (result.error) {
        console.error('[UPDATE_MEMBER_ERROR_DETAILS]', {
          memberUlid: editingMember.ulid,
          error: result.error
        })
        toast({
          title: 'Error updating member',
          description: result.error,
          variant: 'destructive'
        })
        return
      }
      
      console.log('[MEMBER_UPDATED]', { 
        memberUlid: editingMember.ulid,
        name: editingMember.user.name,
        orgId
      })
      toast({
        title: 'Member updated',
        description: `Updated role and status for ${editingMember.user.name}`,
      })
      
      setEditingMember(null)
      loadMembers()
    } catch (error) {
      console.error('[UPDATE_MEMBER_ERROR]', error)
      toast({
        title: 'Error',
        description: 'Failed to update member',
        variant: 'destructive'
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Handle removing a member
  const handleRemoveMember = async () => {
    if (!editingMember) return
    
    try {
      setProcessingAction(true)
      console.log('[REMOVE_MEMBER] Removing member:', editingMember.user.name, 'from organization:', orgId)
      
      const result = await removeOrganizationMember({
        memberUlid: editingMember.ulid,
        organizationUlid: editingMember.organizationUlid,
        userUlid: editingMember.userUlid
      })
      
      if (result.error) {
        console.error('[REMOVE_MEMBER_ERROR_DETAILS]', {
          memberUlid: editingMember.ulid,
          error: result.error
        })
        toast({
          title: 'Error removing member',
          description: result.error,
          variant: 'destructive'
        })
        return
      }
      
      console.log('[MEMBER_REMOVED]', {
        memberUlid: editingMember.ulid,
        name: editingMember.user.name,
        orgId
      })
      toast({
        title: 'Member removed',
        description: `${editingMember.user.name} has been removed from the organization`,
      })
      
      setEditingMember(null)
      setConfirmDeleteDialogOpen(false)
      loadMembers()
    } catch (error) {
      console.error('[REMOVE_MEMBER_ERROR]', error)
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role.toUpperCase()) {
      case 'OWNER':
      case 'GLOBAL_OWNER':
        return 'default'
      case 'DIRECTOR':
      case 'GLOBAL_DIRECTOR':
        return 'default'
      case 'MANAGER':
      case 'GLOBAL_MANAGER':
        return 'default'
      default:
        return 'secondary'
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'default'
      case 'INACTIVE':
        return 'secondary'
      case 'SUSPENDED':
        return 'destructive'
      case 'PENDING':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Organization Members</CardTitle>
            <CardDescription>
              View and manage members of this organization
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-9 max-w-xs w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={loadMembers} 
              disabled={loading}
              className="h-10 w-10 mr-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Dialog 
              open={addDialogOpen} 
              onOpenChange={(open) => {
                setAddDialogOpen(open);
                if (!open) {
                  // Reset the form and validation state when dialog is closed
                  addMemberForm.reset();
                  setEmailValidation({ valid: true, message: '', checking: false });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Member</DialogTitle>
                  <DialogDescription>
                    Add a user who already has an account to this organization
                  </DialogDescription>
                </DialogHeader>
                <Form {...addMemberForm}>
                  <form onSubmit={addMemberForm.handleSubmit(handleAddMember)} className="space-y-6">
                    <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-md text-sm">
                      <p className="font-medium">Note:</p>
                      <p>Users must already have an account in the system before they can be added to an organization. Account creation invitations are not currently supported.</p>
                    </div>
                    
                    <FormField
                      control={addMemberForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="user@example.com" 
                                {...field}
                                onBlur={(e) => {
                                  field.onBlur();
                                  if (e.target.value) {
                                    validateEmail(e.target.value);
                                  } else {
                                    setEmailValidation({ valid: true, message: '', checking: false });
                                  }
                                }}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Reset validation when typing
                                  if (emailValidation.message) {
                                    setEmailValidation({ valid: true, message: '', checking: false });
                                  }
                                }}
                                className={!emailValidation.valid ? "border-red-300 pr-10" : ""}
                              />
                              {emailValidation.checking && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            User must already have an account with this email
                          </FormDescription>
                          {emailValidation.message && (
                            <div className={`text-sm mt-2 ${emailValidation.valid ? 'text-green-600' : 'text-red-500'}`}>
                              {emailValidation.message}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addMemberForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(ORG_ROLES).map(([key, value]) => (
                                <SelectItem key={key} value={value}>
                                  {value.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The member's role and permissions within the organization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={processingAction || !emailValidation.valid || emailValidation.checking}
                      >
                        {processingAction ? 'Adding...' : 'Add Member'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Debug information when members list is empty */}
              {members.length === 0 && (
                <div className="mb-4 p-4 border rounded bg-amber-50 text-amber-700">
                  <h4 className="font-semibold mb-2">No members found. Debug information:</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Organization ID:</strong> {orgId}</p>
                    <p><strong>Organization ID Type:</strong> {typeof orgId}</p>
                    <p><strong>Organization ID Length:</strong> {orgId.length}</p>
                    <p><strong>API Response:</strong> Data received successfully but no members were returned.</p>
                    <p><strong>Current Time:</strong> {new Date().toISOString()}</p>
                    <p className="mt-2">
                      If you're seeing this message, there might be an issue with the organization ID or there are no members associated with this organization. Try adding a member using the "Add Member" button or click the refresh button to try fetching members again.
                    </p>
                  </div>
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.ulid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage 
                                src={
                                  member.user.imageUrl === null 
                                    ? undefined 
                                    : member.user.imageUrl
                                } 
                              />
                              <AvatarFallback>
                                {member.user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.user.name}</div>
                              <div className="text-sm text-muted-foreground">{member.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(member.status)}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingMember(member)
                              }}>
                                <UserCog className="mr-2 h-4 w-4" />
                                Edit Member
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setEditingMember(member)
                                  setConfirmDeleteDialogOpen(true)
                                }}
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember && !confirmDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) setEditingMember(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update details for {editingMember?.user.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...editMemberForm}>
            <form onSubmit={editMemberForm.handleSubmit(handleUpdateMember)} className="space-y-6">
              <FormField
                control={editMemberForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ORG_ROLES).map(([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {value.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editMemberForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingMember(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={processingAction}>
                  {processingAction ? 'Updating...' : 'Update Member'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {editingMember?.user.name} from this organization?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={processingAction}
            >
              {processingAction ? 'Removing...' : 'Remove Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
