"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, ArrowUpRight, TrendingUp, DollarSign, Star, MessageSquare, Building2, Briefcase, GraduationCap, Map, AlertCircle } from "lucide-react"
import { WithOrganizationAuth } from "@/components/auth/with-organization-auth"
import { SYSTEM_ROLES, ORG_ROLES, ORG_LEVELS, PERMISSIONS } from "@/utils/roles/roles"
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DEFAULT_AVATARS } from '@/utils/constants'

function BusinessDashboard() {
  return (
    <div className="flex flex-col justify-center items-start flex-wrap px-4 pt-4 gap-4">
      {/* Quick Actions */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button>
            <Users className="mr-2 h-4 w-4" />
            Manage Employees
          </Button>
          <Button variant="outline">
            <Star className="mr-2 h-4 w-4" />
            Find Coaches
          </Button>
          <Button variant="outline">
            <GraduationCap className="mr-2 h-4 w-4" />
            Mentorship Setup
          </Button>
          <Button variant="outline">
            <Target className="mr-2 h-4 w-4" />
            Set Goals
          </Button>
          <Button variant="outline" className="relative">
            <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
            View Alerts
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              2
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+12 this quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active in Mentorship</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">57% participation rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coaching Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,240</div>
            <p className="text-xs text-muted-foreground">68% utilized this quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preferred Coaches</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Across all specialties</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 sm:grid-cols-1 w-full gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Coaching Sessions</CardTitle>
              <CardDescription>Latest employee mentorship activities</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/business/mentorship">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
              <div className="space-y-6">
                {/* Session entries */}
                <div className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={DEFAULT_AVATARS.COACH} alt="Avatar" />
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Sarah Johnson (Employee)</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>with Coach David Chen</span>
                      <span>•</span>
                      <span>Leadership Development</span>
                    </div>
                  </div>
                  <Star className="h-4 w-4 text-yellow-500 ml-auto" />
                </div>

                <div className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={DEFAULT_AVATARS.COACH} alt="Avatar" />
                    <AvatarFallback>MR</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Michael Rodriguez (Employee)</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>with Coach Lisa Wong</span>
                      <span>•</span>
                      <span>Sales Excellence</span>
                    </div>
                  </div>
                  <Star className="h-4 w-4 text-yellow-500 ml-auto" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mentorship Program Overview</CardTitle>
            <CardDescription>Program effectiveness and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Employee Participation</span>
                  <span className="text-sm font-medium">57%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-full w-[57%] bg-blue-500 rounded-full"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Budget Utilization</span>
                  <span className="text-sm font-medium">68%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-full w-[68%] bg-green-500 rounded-full"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session Satisfaction</span>
                  <span className="text-sm font-medium">92%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-full w-[92%] bg-yellow-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Program Impact</CardTitle>
          <CardDescription>Mentorship program effectiveness metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Coaching Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Leadership Development</span>
                    <span className="text-sm font-medium">32%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sales Excellence</span>
                    <span className="text-sm font-medium">28%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Client Relations</span>
                    <span className="text-sm font-medium">24%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Employee Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Performance Improvement</p>
                      <p className="text-xs text-muted-foreground">Based on manager feedback</p>
                    </div>
                    <span className="text-green-500 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      24%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Skill Development</p>
                      <p className="text-xs text-muted-foreground">Self-reported progress</p>
                    </div>
                    <span className="text-green-500 flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      31%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Program Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Budget Alert</p>
                      <p className="text-xs text-muted-foreground">Q4 budget 68% utilized</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">High Demand Notice</p>
                      <p className="text-xs text-muted-foreground">Leadership coaching slots filling quickly</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WithOrganizationAuth(BusinessDashboard, {
  requiredSystemRole: SYSTEM_ROLES.USER,
  requiredOrgRole: ORG_ROLES.OWNER,
  requiredOrgLevel: ORG_LEVELS.LOCAL,
  requiredPermissions: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.MANAGE_ORGANIZATION
  ],
  requireOrganization: true
});

