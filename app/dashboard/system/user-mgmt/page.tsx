"use client"

import { useEffect, useState } from "react"
import { UserManagementTable } from "../_components/user-management-table"
import { fetchUsers, User } from "@/utils/actions/admin-actions"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [status, setStatus] = useState("all")
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      setLoading(true)
      const result = await fetchUsers({
        search,
        role: role === 'all' ? undefined : role,
        status: status === 'all' ? undefined : status
      })

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive"
        })
        return
      }

      if (!result.data) {
        toast({
          title: "Error",
          description: "No data received from server",
          variant: "destructive"
        })
        return
      }

      setUsers(result.data.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [search, role, status])

  return (
    <div className="container space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="SYSTEM_OWNER">System Owner</SelectItem>
            <SelectItem value="SYSTEM_MODERATOR">System Moderator</SelectItem>
            <SelectItem value="USER">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setSearch("")
            setRole("all")
            setStatus("all")
          }}
        >
          Reset Filters
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        </div>
      ) : (
        <UserManagementTable users={users} onRefresh={loadUsers} />
      )}
    </div>
  )
}
