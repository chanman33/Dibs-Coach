"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { SYSTEM_ROLES } from "@/utils/roles/roles";
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

// Types for our data
type UserWithRole = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  systemRole: string;
  status: string;
};

type PendingRoleChange = {
  userId: number;
  currentRole: string;
  newRole: string;
  email: string;
} | null;

// Create server action for updating user role
async function updateUserRole(userId: number, newRole: string) {
  try {
    const response = await fetch("/api/admin/update-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ targetUserId: userId, newRole }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[UPDATE_ROLE_ERROR]", error);
    throw error;
  }
}

export default function PermissionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("[FETCH_USERS_ERROR]", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchTerm) ||
      user.firstName?.toLowerCase().includes(searchTerm) ||
      user.lastName?.toLowerCase().includes(searchTerm) ||
      user.systemRole.toLowerCase().includes(searchTerm)
    );
  });

  // Handle role change confirmation
  const handleRoleChange = async () => {
    if (!pendingRoleChange) return;

    try {
      const { userId, newRole } = pendingRoleChange;
      const result = await updateUserRole(userId, newRole);
      toast.success(result.message || "Role updated successfully");
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, systemRole: newRole } : user
      ));
      
      router.refresh();
    } catch (error) {
      toast.error("Failed to update role");
    } finally {
      setPendingRoleChange(null);
    }
  };

  // Define table columns
  const columns: ColumnDef<UserWithRole>[] = [
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "firstName",
      header: "First Name",
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
    },
    {
      accessorKey: "systemRole",
      header: "Role",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Select
            defaultValue={user.systemRole}
            onValueChange={(newRole) => {
              // Only allow system owner role for @wedibs.com or @dibs.coach emails
              if (
                newRole === SYSTEM_ROLES.SYSTEM_OWNER &&
                !user.email.endsWith("@wedibs.com") &&
                !user.email.endsWith("@dibs.coach")
              ) {
                toast.error("Only @wedibs.com or @dibs.coach emails can be assigned system owner role");
                return;
              }

              setPendingRoleChange({
                userId: user.id,
                currentRole: user.systemRole,
                newRole,
                email: user.email,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SYSTEM_ROLES.USER}>User</SelectItem>
              <SelectItem value={SYSTEM_ROLES.SYSTEM_MODERATOR}>System Moderator</SelectItem>
              {(user.email.endsWith("@wedibs.com") || user.email.endsWith("@dibs.coach")) && (
                <SelectItem value={SYSTEM_ROLES.SYSTEM_OWNER}>System Owner</SelectItem>
              )}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>User Permissions</CardTitle>
          <CardDescription>
            Manage user roles and permissions. Note: System Owner role can only be assigned to @wedibs.com or
            @dibs.coach email addresses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredUsers}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingRoleChange} onOpenChange={() => setPendingRoleChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the role of user{" "}
              <span className="font-medium">{pendingRoleChange?.email}</span> from{" "}
              <span className="font-medium">{pendingRoleChange?.currentRole}</span> to{" "}
              <span className="font-medium">{pendingRoleChange?.newRole}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>Confirm Change</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
