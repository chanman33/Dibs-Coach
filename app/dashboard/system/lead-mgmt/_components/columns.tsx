"use client"

import { ColumnDef } from "@tanstack/react-table"
import { LeadListItem } from "@/utils/types/leads"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ExternalLink, Copy, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Excel-inspired colors
const excelBlue = "#4472C4"
const excelLightBlue = "#5B9BD5"
const excelRed = "#C00000"
const excelGreen = "#70AD47"
const excelYellow = "#FFC000"
const excelOrange = "#ED7D31"
const excelGray = "#A5A5A5"
const excelDarkGray = "#7F7F7F"

export const columns: ColumnDef<LeadListItem>[] = [
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => {
      const companyName = row.getValue("companyName") as string
      return (
        <Link
          href={`/dashboard/system/lead-mgmt/${row.original.ulid}`}
          className="font-medium text-[#4472C4] hover:underline flex items-center"
        >
          {companyName}
        </Link>
      )
    },
  },
  {
    id: "contact",
    header: "Contact",
    accessorFn: (row) => `${row.fullName} ${row.email}`, // For sorting/filtering
    cell: ({ row }) => {
      const fullName = row.original.fullName
      const email = row.original.email
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
      
      // Excel-inspired status colors
      const statusColors: Record<string, string> = {
        NEW: "bg-[#4472C4] text-white",
        CONTACTED: "bg-[#ED7D31] text-white",
        QUALIFIED: "bg-[#A5A5A5] text-white",
        PROPOSAL: "bg-[#FFC000] text-white",
        NEGOTIATION: "bg-[#5B9BD5] text-white",
        WON: "bg-[#70AD47] text-white",
        LOST: "bg-[#C00000] text-white",
        ARCHIVED: "bg-[#7F7F7F] text-white"
      }
      
      return (
        <Badge className={`${statusColors[status] || "bg-gray-100 text-gray-800"} font-medium`}>
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
      
      // Excel-inspired priority colors
      const priorityColors: Record<string, string> = {
        HIGH: "bg-[#C00000] text-white",
        MEDIUM: "bg-[#FFC000] text-white",
        LOW: "bg-[#70AD47] text-white",
      }
      
      return (
        <Badge className={`${priorityColors[priority] || "bg-gray-100 text-gray-800"} font-medium`}>
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
              className="flex items-center cursor-pointer"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Link href={`/dashboard/system/lead-mgmt/${row.original.ulid}`} className="flex items-center w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center cursor-pointer">
              <Edit className="h-4 w-4 mr-2" />
              Edit Lead
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[#C00000] flex items-center cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 