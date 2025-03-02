import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Building2, TrendingUp, Briefcase, Award, BookOpen, BarChart3, Building, DollarSign, Users } from "lucide-react"

// Mock data for demonstration - replace with real data from your backend
const mockMetrics = {
  yearsExperience: 15,
  totalTransactionValue: "150M",
  totalSqFtLeased: "850K",
  totalSqFtSold: "1.2M",
  clientCount: 85,
  avgDealSize: "3.5M"
}

const mockTransactions = [
  {
    title: "Downtown Office Complex",
    type: "Office",
    transactionType: "Sale",
    location: "Financial District",
    size: "125,000",
    value: "28.5M",
    details: "Class A office building, 95% occupied",
    outcome: "Sold above asking price with multiple competing offers",
    highlights: ["1031 Exchange", "Off-market deal", "Portfolio sale"]
  },
  {
    title: "Industrial Distribution Center",
    type: "Industrial",
    transactionType: "Lease",
    location: "Logistics Hub",
    size: "250,000",
    value: "15M",
    details: "Modern logistics facility with cross-dock capabilities",
    outcome: "15-year triple net lease to Fortune 500 company",
    highlights: ["Build-to-suit", "Long-term lease", "Credit tenant"]
  },
  {
    title: "Mixed-Use Development",
    type: "Mixed-Use",
    transactionType: "Sale",
    location: "Urban Core",
    size: "85,000",
    value: "42M",
    details: "Retail ground floor with luxury apartments above",
    outcome: "Successful value-add repositioning and disposition",
    highlights: ["Value-add", "Repositioning", "Urban location"]
  }
]

const mockSpecialties = [
  {
    category: "Office",
    deals: 28,
    description: "Class A & B office properties, medical office buildings, and corporate headquarters",
    expertise: ["Tenant Representation", "Owner Representation", "Sale-Leaseback", "Build-to-Suit"]
  },
  {
    category: "Industrial",
    deals: 35,
    description: "Distribution centers, manufacturing facilities, and flex spaces",
    expertise: ["Triple Net Leases", "Port-Related Facilities", "Last-Mile Distribution", "Cold Storage"]
  },
  {
    category: "Retail",
    deals: 22,
    description: "Shopping centers, single-tenant retail, and mixed-use developments",
    expertise: ["Anchor Tenant Leasing", "Outparcel Development", "Retail Pad Sites", "Restaurant Sites"]
  }
]

export function CommercialListings() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Commercial Real Estate Portfolio</h2>
            <p className="text-sm text-muted-foreground">
              Track record of successful commercial real estate transactions and expertise
            </p>
          </div>
        </div>
      </Card>

      {/* Success Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100/50 dark:bg-blue-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Transaction Value</p>
                <p className="text-2xl font-bold tracking-tight">${mockMetrics.totalTransactionValue}</p>
                <p className="text-sm text-muted-foreground">Avg Deal: ${mockMetrics.avgDealSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100/50 dark:bg-green-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Square Footage</p>
                <p className="text-2xl font-bold tracking-tight">{mockMetrics.totalSqFtSold}SF</p>
                <p className="text-sm text-muted-foreground">Sold & Leased Combined</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100/50 dark:bg-purple-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Satisfied Clients</p>
                <p className="text-2xl font-bold tracking-tight">{mockMetrics.clientCount}+</p>
                <p className="text-sm text-muted-foreground">{mockMetrics.yearsExperience} Years Experience</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Notable Transactions</TabsTrigger>
          <TabsTrigger value="specialties">Market Specialties</TabsTrigger>
          <TabsTrigger value="expertise">Areas of Expertise</TabsTrigger>
        </TabsList>

        {/* Notable Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Significant Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="grid gap-6">
                  {mockTransactions.map((transaction, index) => (
                    <Card key={index} className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{transaction.title}</h3>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{transaction.type}</Badge>
                              <Badge variant="outline">{transaction.location}</Badge>
                              <Badge>{transaction.transactionType}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${transaction.value}</p>
                            <p className="text-sm text-muted-foreground">{transaction.size} SF</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">{transaction.details}</p>
                        </div>

                        <div>
                          <p className="font-medium">{transaction.outcome}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {transaction.highlights.map((highlight, i) => (
                            <Badge key={i} variant="secondary">{highlight}</Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Specialties Tab */}
        <TabsContent value="specialties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Market Specialties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="grid gap-6">
                  {mockSpecialties.map((specialty, index) => (
                    <Card key={index} className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{specialty.category}</h3>
                            <Badge variant="secondary">{specialty.deals} Transactions</Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {specialty.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {specialty.expertise.map((item, i) => (
                            <Badge key={i} variant="outline">{item}</Badge>
                          ))}
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
                Professional Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Transaction Types</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Investment Sales</Badge>
                    <Badge variant="secondary">Tenant Representation</Badge>
                    <Badge variant="secondary">Landlord Representation</Badge>
                    <Badge variant="secondary">Sale-Leaseback</Badge>
                    <Badge variant="secondary">1031 Exchanges</Badge>
                    <Badge variant="secondary">Build-to-Suit</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Property Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Class A Office</Badge>
                    <Badge variant="secondary">Medical Office</Badge>
                    <Badge variant="secondary">Industrial/Logistics</Badge>
                    <Badge variant="secondary">Retail Centers</Badge>
                    <Badge variant="secondary">Mixed-Use</Badge>
                    <Badge variant="secondary">Land Development</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Advisory Services</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Market Analysis</Badge>
                    <Badge variant="secondary">Investment Strategy</Badge>
                    <Badge variant="secondary">Due Diligence</Badge>
                    <Badge variant="secondary">Portfolio Optimization</Badge>
                    <Badge variant="secondary">Asset Positioning</Badge>
                    <Badge variant="secondary">Lease Structuring</Badge>
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