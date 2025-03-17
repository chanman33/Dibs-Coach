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
import { Check, UserPlus, Search, MoreHorizontal, Mail, UserMinus, UserCog } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ORG_ROLES } from '@/utils/roles/roles'
import { fetchOrganizationMembers, addOrganizationMember, updateOrganizationMember, removeOrganizationMember } from '@/utils/actions/organization-actions'
import { generateUlid } from '@/utils/ulid'

interface OrganizationMembersData {
  ulid: string
  userUlid: string
  organizationUlid: string
  role: string
  status: string
  createdAt: string
  user: {
    ulid: string
    name: string
    email: string
    imageUrl?: string
  }
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

  // Initial load
  useEffect(() => {
    loadMembers()
  }, [orgId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const result = await fetchOrganizationMembers({ orgId })

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error.message,
          variant: 'destructive'
        })
        return
      }

      setMembers(result.data || [])
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
      setProcessingAction(true)
      
      const ulid = generateUlid()
      
      const result = await addOrganizationMember({
        ulid,
        organizationUlid: orgId,
        email: data.email,
        role: data.role
      })
      
      if (result.error) {
        toast({
          title: 'Error adding member',
          description: result.error.message,
          variant: 'destructive'
        })
        return
      }
      
      toast({
        title: 'Member invited',
        description: `Invitation sent to ${data.email}`,
      })
      
      setAddDialogOpen(false)
      addMemberForm.reset()
      loadMembers()
    } catch (error) {
      console.error('[ADD_MEMBER_ERROR]', error)
      toast({
        title: 'Error',
        description: 'Failed to add member',
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
      
      const result = await updateOrganizationMember({
        memberUlid: editingMember.ulid,
        role: data.role,
        status: data.status
      })
      
      if (result.error) {
        toast({
          title: 'Error updating member',
          description: result.error.message,
          variant: 'destructive'
        })
        return
      }
      
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
      
      const result = await removeOrganizationMember({
        memberUlid: editingMember.ulid
      })
      
      if (result.error) {
        toast({
          title: 'Error removing member',
          description: result.error.message,
          variant: 'destructive'
        })
        return
      }
      
      toast({
        title: 'Member removed',
        description: `${editingMember.user.name} has been removed from the organization`,
      })
      
      setConfirmDeleteDialogOpen(false)
      setEditingMember(null)
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
    if (role.includes('OWNER')) return 'default'
    if (role.includes('DIRECTOR')) return 'secondary'
    if (role.includes('MANAGER')) return 'outline'
    return 'secondary'
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'success'
      case 'INACTIVE':
        return 'secondary'
      case 'SUSPENDED':
        return 'destructive'
      case 'PENDING':
        return 'warning'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">Organization Members</CardTitle>
            <CardDescription>
              View and manage members of this organization
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Member</DialogTitle>
                  <DialogDescription>
                    Invite a new member to this organization
                  </DialogDescription>
                </DialogHeader>
                <Form {...addMemberForm}>
                  <form onSubmit={addMemberForm.handleSubmit(handleAddMember)} className="space-y-6">
                    <FormField
                      control={addMemberForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="user@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            An invitation will be sent to this email address
                          </FormDescription>
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
                      <Button type="submit" disabled={processingAction}>
                        {processingAction ? 'Sending...' : 'Send Invitation'}
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
                            <AvatarImage src={member.user.imageUrl} />
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
                            <DropdownMenuItem onClick={() => {
                              // Functionality for sending a direct message could be added here
                            }}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Message
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