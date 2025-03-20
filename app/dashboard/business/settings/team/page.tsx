"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  UserPlus, 
  Search, 
  Download, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar, 
  GraduationCap,
  BadgeCheck,
  Target,
  Star
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_AVATARS } from "@/utils/constants"

// Mock data for team members
const teamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "(555) 123-4567",
    role: "Senior Associate",
    specialization: "Client Relations",
    certificationExpiry: "2023-12-15",
    hireDate: "2019-05-10",
    performanceTier: "Top Performer",
    avatar: DEFAULT_AVATARS.USER
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    email: "michael.r@example.com",
    phone: "(555) 234-5678",
    role: "Associate",
    specialization: "Client Acquisition",
    certificationExpiry: "2023-06-30",
    hireDate: "2020-03-22",
    performanceTier: "Rising Star",
    avatar: DEFAULT_AVATARS.USER
  },
  {
    id: 3,
    name: "Jennifer Lee",
    email: "jennifer.lee@example.com",
    phone: "(555) 345-6789",
    role: "Team Lead",
    specialization: "Commercial",
    certificationExpiry: "2024-02-15",
    hireDate: "2018-01-15",
    performanceTier: "Top Performer",
    avatar: DEFAULT_AVATARS.USER
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david.w@example.com",
    phone: "(555) 456-7890",
    role: "Associate",
    specialization: "Residential",
    certificationExpiry: "2023-08-22",
    hireDate: "2021-07-18",
    performanceTier: "Standard",
    avatar: DEFAULT_AVATARS.USER
  },
  {
    id: 5,
    name: "Amanda Garcia",
    email: "amanda.g@example.com",
    phone: "(555) 567-8901",
    role: "New Associate",
    specialization: "Residential",
    certificationExpiry: "2024-05-10",
    hireDate: "2023-01-05",
    performanceTier: "New Hire",
    avatar: DEFAULT_AVATARS.USER
  }
]

export default function TeamDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter team members based on search query
  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Format date in a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Check if certification is expiring soon (within 60 days)
  const isCertificationExpiringSoon = (dateString: string) => {
    const expiryDate = new Date(dateString)
    const today = new Date()
    const daysDifference = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysDifference > 0 && daysDifference <= 60
  }

  // Format phone number
  const formatPhone = (phone: string) => {
    return phone
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Directory</h1>
          <p className="text-muted-foreground">Manage your team members and their information</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search team members..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Team Members Table */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Your team of {teamMembers.length} professionals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Role & Specialization</TableHead>
                <TableHead>Certification Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}{member.name.split(' ')[1]?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Since {formatDate(member.hireDate)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-xs">
                        <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>{formatPhone(member.phone)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <Badge variant="outline" className="w-fit py-0 text-xs">
                        {member.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{member.specialization}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className={`text-xs ${isCertificationExpiringSoon(member.certificationExpiry) ? 'text-amber-600 font-medium' : ''}`}>
                        {formatDate(member.certificationExpiry)}
                        {isCertificationExpiringSoon(member.certificationExpiry) && (
                          <span className="ml-1 text-amber-600 text-xs">(Expiring soon)</span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        member.performanceTier === "Top Performer" ? "default" :
                        member.performanceTier === "Rising Star" ? "secondary" :
                        member.performanceTier === "New Hire" ? "outline" : 
                        "secondary"
                      }
                      className="text-xs"
                    >
                      {member.performanceTier}
                    </Badge>
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
                        <DropdownMenuItem>
                          <Target className="mr-2 h-4 w-4" />
                          <span>View Goals</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <GraduationCap className="mr-2 h-4 w-4" />
                          <span>Training Status</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BadgeCheck className="mr-2 h-4 w-4" />
                          <span>Certification Info</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="mr-2 h-4 w-4" />
                          <span>Performance</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Certification Renewals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Members with certifications expiring in next 60 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Training Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Members current on required training</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Members in Top Performer tier</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Hires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Members joined in the last 90 days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 