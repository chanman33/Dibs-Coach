"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, UserCog, Loader2 } from "lucide-react"
import { updateUserStatus, fetchUsers } from "@/utils/actions/admin-actions"
import { toast } from "react-hot-toast"

interface User {
  id: number
  name: string
  email: string
  role: "admin" | "coach" | "mentee"
  status: "active" | "inactive" | "suspended"
  createdAt: string
}

export function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await fetchUsers()
      
      if (error) {
        throw error
      }

      if (data) {
        setUsers(data)
      }
    } catch (err) {
      console.error("[USER_MANAGEMENT_ERROR]", err)
      setError("Failed to load users")
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleStatusUpdate = async (userId: number, newStatus: "active" | "inactive") => {
    try {
      const { success, error } = await updateUserStatus(userId, newStatus)
      
      if (success) {
        toast.success(`User status updated to ${newStatus}`)
        // Refresh the user list
        await loadUsers()
      } else {
        toast.error(`Failed to update user status: ${error?.message}`)
      }
    } catch (error) {
      toast.error("An error occurred while updating user status")
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <Badge variant="outline" className="capitalize">
            {role.toLowerCase()}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge
            variant={
              status === "active"
                ? "default"
                : status === "inactive"
                ? "secondary"
                : "destructive"
            }
            className="capitalize"
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString()
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        const [isLoading, setIsLoading] = useState(false)

        const handleAction = async () => {
          try {
            setIsLoading(true)
            const newStatus = user.status === "active" ? "inactive" : "active"
            await handleStatusUpdate(user.id, newStatus)
          } finally {
            setIsLoading(false)
          }
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                <span className="sr-only">Open menu</span>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleAction} disabled={isLoading}>
                {user.status === "active" ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        <p className="text-muted-foreground mt-2">Loading users...</p>
      </div>
    )
  }

  return <DataTable columns={columns} data={users} searchKey="email" />
} 