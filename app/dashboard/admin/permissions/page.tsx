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

// Types for our data
type UserWithRole = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
};

// Create server action for updating user role
async function updateUserRole(userId: number, newRole: string) {
  try {
    const response = await fetch("/api/admin/update-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, role: newRole }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return { success: true };
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
      user.role.toLowerCase().includes(searchTerm)
    );
  });

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
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Select
            defaultValue={user.role}
            onValueChange={async (newRole) => {
              try {
                // Only allow admin role for @wedibs.com or @dibs.coach emails
                if (
                  newRole === "ADMIN" &&
                  !user.email.endsWith("@wedibs.com") &&
                  !user.email.endsWith("@dibs.coach")
                ) {
                  toast.error("Only @wedibs.com or @dibs.coach emails can be assigned admin role");
                  return;
                }

                await updateUserRole(user.id, newRole);
                toast.success("Role updated successfully");
                router.refresh();
              } catch (error) {
                toast.error("Failed to update role");
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MENTEE">Mentee</SelectItem>
              <SelectItem value="COACH">Coach</SelectItem>
              {(user.email.endsWith("@wedibs.com") || user.email.endsWith("@dibs.coach")) && (
                <SelectItem value="ADMIN">Admin</SelectItem>
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
            Manage user roles and permissions. Note: Admin role can only be assigned to @wedibs.com or
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
    </div>
  );
}
