"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MoreHorizontal, UserCog, Loader2 } from "lucide-react"
import { updateUserStatus, updateUserCapability, fetchUsers, User } from "@/utils/actions/admin-actions"
import { useToast } from "@/components/ui/use-toast"
import { USER_CAPABILITIES } from "@/utils/roles/roles"

interface UserManagementTableProps {
  users: User[]
  onRefresh: () => void
}

export function UserManagementTable({ users, onRefresh }: UserManagementTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showCapabilityDialog, setShowCapabilityDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'suspended'>('active')
  const [capabilityAction, setCapabilityAction] = useState<'add' | 'remove'>('add')
  const { toast } = useToast()

  const handleStatusUpdate = async () => {
    if (!selectedUser) return

    try {
      setLoading(selectedUser.ulid)
      const result = await updateUserStatus({
        userUlid: selectedUser.ulid,
        status: newStatus
      })

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Success",
        description: "User status updated successfully"
      })
      onRefresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      })
    } finally {
      setLoading(null)
      setSelectedUser(null)
      setShowStatusDialog(false)
    }
  }

  const handleCapabilityUpdate = async () => {
    if (!selectedUser) return

    try {
      setLoading(selectedUser.ulid)
      const result = await updateUserCapability({
        userUlid: selectedUser.ulid,
        capability: USER_CAPABILITIES.COACH,
        action: capabilityAction
      })

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Success",
        description: `User ${capabilityAction === 'add' ? 'granted' : 'removed'} COACH capability successfully`
      })
      onRefresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user capability",
        variant: "destructive"
      })
    } finally {
      setLoading(null)
      setSelectedUser(null)
      setShowCapabilityDialog(false)
    }
  }

  const openStatusDialog = (user: User, status: 'active' | 'inactive' | 'suspended') => {
    setSelectedUser(user)
    setNewStatus(status)
    setShowStatusDialog(true)
  }

  const openCapabilityDialog = (user: User, action: 'add' | 'remove') => {
    setSelectedUser(user)
    setCapabilityAction(action)
    setShowCapabilityDialog(true)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.ulid}>
                <TableCell>
                  {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.systemRole}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    user.status === 'active' 
                      ? 'bg-green-50 text-green-700' 
                      : user.status === 'inactive'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell>
                  {user.isCoach && <span className="mr-2">Coach</span>}
                  {user.isMentee && <span>Mentee</span>}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              disabled={loading === user.ulid}
                            >
                              {loading === user.ulid ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>User actions</p>
                        </TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openStatusDialog(user, 'active')}
                          disabled={user.status === 'active'}
                        >
                          Set Active
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openStatusDialog(user, 'inactive')}
                          disabled={user.status === 'inactive'}
                        >
                          Set Inactive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openStatusDialog(user, 'suspended')}
                          disabled={user.status === 'suspended'}
                          className="text-red-600"
                        >
                          Suspend User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Capabilities</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => openCapabilityDialog(user, 'add')}
                          disabled={user.isCoach}
                        >
                          Add Coach Capability
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openCapabilityDialog(user, 'remove')}
                          disabled={!user.isCoach}
                          className="text-red-600"
                        >
                          Remove Coach Capability
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update User Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set this user's status to {newStatus}?
              {newStatus === 'suspended' && (
                <p className="mt-2 text-red-600">
                  This will prevent the user from accessing the platform.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              className={newStatus === 'suspended' ? 'bg-red-600 hover:bg-red-700' : undefined}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCapabilityDialog} onOpenChange={setShowCapabilityDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {capabilityAction === 'add' ? 'Add' : 'Remove'} Coach Capability
            </AlertDialogTitle>
            <AlertDialogDescription>
              {capabilityAction === 'add' 
                ? 'Are you sure you want to add the Coach capability to this user? This will allow them to function as a coach in the system.'
                : 'Are you sure you want to remove the Coach capability from this user? This will prevent them from functioning as a coach in the system.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCapabilityUpdate}
              className={capabilityAction === 'remove' ? 'bg-red-600 hover:bg-red-700' : undefined}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 