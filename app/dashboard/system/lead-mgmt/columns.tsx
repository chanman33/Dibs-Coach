import { ColumnDef } from "@tanstack/react-table"
import { LeadListItem } from "@/utils/types/leads"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export const columns: ColumnDef<LeadListItem>[] = [
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => {
      const companyName = row.getValue("companyName") as string
      return (
        <Link
          href={`/dashboard/system/lead-mgmt/${row.original.ulid}`}
          className="font-medium hover:underline"
        >
          {companyName}
        </Link>
      )
    },
  },
  {
    accessorKey: "fullName",
    header: "Contact",
    cell: ({ row }) => {
      const fullName = row.getValue("fullName") as string
      const email = row.getValue("email") as string
      return (
        <div>
          <div className="font-medium">{fullName}</div>
          <div className="text-sm text-muted-foreground">{email}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusColors: Record<string, string> = {
        NEW: "bg-blue-100 text-blue-800",
        CONTACTED: "bg-yellow-100 text-yellow-800",
        QUALIFIED: "bg-green-100 text-green-800",
        PROPOSAL: "bg-purple-100 text-purple-800",
        NEGOTIATION: "bg-indigo-100 text-indigo-800",
        WON: "bg-emerald-100 text-emerald-800",
        LOST: "bg-red-100 text-red-800",
      }
      return (
        <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      const priorityColors: Record<string, string> = {
        HIGH: "bg-red-100 text-red-800",
        MEDIUM: "bg-yellow-100 text-yellow-800",
        LOW: "bg-green-100 text-green-800",
      }
      return (
        <Badge className={priorityColors[priority] || "bg-gray-100 text-gray-800"}>
          {priority}
        </Badge>
      )
    },
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => {
      const assignedTo = row.getValue("assignedTo") as { fullName: string; email: string } | undefined
      return assignedTo ? (
        <div>
          <div className="font-medium">{assignedTo.fullName}</div>
          <div className="text-sm text-muted-foreground">{assignedTo.email}</div>
        </div>
      ) : (
        <span className="text-muted-foreground">Unassigned</span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt") as string)
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(row.original.ulid)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/dashboard/system/lead-mgmt/${row.original.ulid}`}>
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Lead</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Delete Lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 