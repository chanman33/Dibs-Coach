import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Building2, TrendingUp, Briefcase, Award, BookOpen, BarChart3 } from "lucide-react"

// Mock data for demonstration - replace with real data from your backend
const mockMetrics = {
  yearsExperience: 12,
  dealsCompleted: 45,
  portfolioSize: "25M",
  successRate: 92
}

const mockStrategies = [
  { name: "Value-Add Multifamily", count: 15, description: "Improving underperforming apartment communities" },
  { name: "Commercial Repositioning", count: 8, description: "Modernizing and repositioning retail and office spaces" },
  { name: "Land Development", count: 5, description: "Strategic land acquisition and development" },
  { name: "Property Turnaround", count: 12, description: "Rehabilitating distressed properties" }
]

const mockCaseStudies = [
  {
    title: "Urban Apartment Complex Renovation",
    type: "Multifamily",
    location: "Phoenix, AZ",
    units: 120,
    strategy: "Value-Add",
    outcome: "Increased NOI by 45% through strategic improvements",
    duration: "18 months"
  },
  {
    title: "Retail Center Repositioning",
    type: "Commercial",
    location: "Dallas, TX",
    sqft: "45,000",
    strategy: "Repositioning",
    outcome: "95% occupancy achieved from 60%",
    duration: "24 months"
  }
]

export function InvestorListings() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Investment Portfolio & Track Record</h2>
            <p className="text-sm text-muted-foreground">
              Showcasing investment experience and successful outcomes
            </p>
          </div>
        </div>
      </Card>

      {/* Success Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100/50 dark:bg-blue-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Years Experience</p>
                <p className="text-2xl font-bold tracking-tight">{mockMetrics.yearsExperience}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100/50 dark:bg-green-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Deals Completed</p>
                <p className="text-2xl font-bold tracking-tight">{mockMetrics.dealsCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100/50 dark:bg-yellow-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                <Briefcase className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Portfolio Size</p>
                <p className="text-2xl font-bold tracking-tight">${mockMetrics.portfolioSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100/50 dark:bg-purple-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold tracking-tight">{mockMetrics.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="strategies" className="w-full">
        <TabsList>
          <TabsTrigger value="strategies">Investment Strategies</TabsTrigger>
          <TabsTrigger value="case-studies">Case Studies</TabsTrigger>
          <TabsTrigger value="expertise">Areas of Expertise</TabsTrigger>
        </TabsList>

        {/* Investment Strategies Tab */}
        <TabsContent value="strategies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Investment Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-4">
                  {mockStrategies.map((strategy, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{strategy.name}</h3>
                            <Badge variant="secondary">{strategy.count} Projects</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{strategy.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Case Studies Tab */}
        <TabsContent value="case-studies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Notable Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-6">
                  {mockCaseStudies.map((study, index) => (
                    <Card key={index} className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{study.title}</h3>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{study.type}</Badge>
                              <Badge variant="outline">{study.location}</Badge>
                            </div>
                          </div>
                          <Badge>{study.strategy}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Project Size</p>
                            <p className="font-medium">
                              {study.units ? `${study.units} Units` : `${study.sqft} sq ft`}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-medium">{study.duration}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-muted-foreground text-sm">Outcome</p>
                          <p className="font-medium">{study.outcome}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Areas of Expertise Tab */}
        <TabsContent value="expertise">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Investment Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Property Types</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Multifamily</Badge>
                    <Badge variant="secondary">Commercial Retail</Badge>
                    <Badge variant="secondary">Office Space</Badge>
                    <Badge variant="secondary">Mixed-Use Development</Badge>
                    <Badge variant="secondary">Land Development</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Investment Approaches</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Value-Add</Badge>
                    <Badge variant="secondary">Repositioning</Badge>
                    <Badge variant="secondary">Development</Badge>
                    <Badge variant="secondary">Asset Management</Badge>
                    <Badge variant="secondary">Portfolio Optimization</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Market Analysis</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Market Research</Badge>
                    <Badge variant="secondary">Due Diligence</Badge>
                    <Badge variant="secondary">Financial Modeling</Badge>
                    <Badge variant="secondary">Risk Assessment</Badge>
                    <Badge variant="secondary">Trend Analysis</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 