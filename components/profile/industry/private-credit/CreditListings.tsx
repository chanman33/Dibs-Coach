import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { 
  Briefcase, 
  LineChart, 
  BarChart3, 
  Shield, 
  Target, 
  TrendingUp,
  Users,
  Building,
  FileText
} from "lucide-react"

// Mock data for demonstration - replace with real data from your backend
const mockMetrics = {
  yearsExperience: 18,
  totalDeployedCapital: "2.5B",
  avgDealSize: "75M",
  successfulDeals: 85,
  defaultRate: "0.5",
  avgIRR: "14.2"
}

const mockTransactions = [
  {
    title: "Senior Secured Term Loan",
    sector: "Healthcare Technology",
    type: "Direct Lending",
    size: "120M",
    structure: "1st Lien",
    terms: "5-year, L+550",
    outcome: "Successfully refinanced with improved terms after 2 years",
    highlights: ["Lead Arranger", "Covenant-lite", "ESG-linked pricing"]
  },
  {
    title: "Unitranche Facility",
    sector: "Software & Services",
    type: "Sponsored",
    size: "200M",
    structure: "Unitranche",
    terms: "6-year, L+650",
    outcome: "Supported successful add-on acquisitions and organic growth",
    highlights: ["Sole Lender", "Delayed Draw", "Accordion Feature"]
  },
  {
    title: "Mezzanine Investment",
    sector: "Industrial Manufacturing",
    type: "Non-Sponsored",
    size: "45M",
    structure: "Subordinated",
    terms: "5-year, 12% + 2% PIK",
    outcome: "Full repayment with warrants exercised for additional return",
    highlights: ["Board Observer Rights", "Warrant Coverage", "Strategic Advisory"]
  }
]

const mockStrategies = [
  {
    category: "Direct Lending",
    deals: 45,
    description: "First lien, unitranche, and second lien loans to middle-market companies",
    expertise: ["Senior Secured", "Unitranche", "2nd Lien", "Covenant Structure"]
  },
  {
    category: "Special Situations",
    deals: 15,
    description: "Rescue financing, restructuring, and distressed opportunities",
    expertise: ["Rescue Finance", "Restructuring", "Turnaround", "Asset-Based"]
  },
  {
    category: "Structured Credit",
    deals: 25,
    description: "Bespoke financing solutions and complex credit structures",
    expertise: ["Preferred Equity", "Hybrid Instruments", "Mezzanine", "Revenue-Based"]
  }
]

export function CreditListings() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Private Credit Track Record</h2>
            <p className="text-sm text-muted-foreground">
              Demonstrating expertise in credit markets and deal structuring
            </p>
          </div>
        </div>
      </Card>

      {/* Success Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100/50 dark:bg-blue-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Deployed Capital</p>
                <p className="text-2xl font-bold tracking-tight">${mockMetrics.totalDeployedCapital}</p>
                <p className="text-sm text-muted-foreground">Avg Deal: ${mockMetrics.avgDealSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100/50 dark:bg-green-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Track Record</p>
                <p className="text-2xl font-bold tracking-tight">{mockMetrics.avgIRR}% IRR</p>
                <p className="text-sm text-muted-foreground">{mockMetrics.defaultRate}% Default Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100/50 dark:bg-purple-500/20 rounded-lg group-hover:scale-105 transition-transform duration-300">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Experience</p>
                <p className="text-2xl font-bold tracking-tight">{mockMetrics.successfulDeals}</p>
                <p className="text-sm text-muted-foreground">{mockMetrics.yearsExperience} Years in Credit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Notable Transactions</TabsTrigger>
          <TabsTrigger value="strategies">Investment Strategies</TabsTrigger>
          <TabsTrigger value="expertise">Credit Expertise</TabsTrigger>
        </TabsList>

        {/* Notable Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Representative Transactions
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
                              <Badge variant="outline">{transaction.sector}</Badge>
                              <Badge>{transaction.type}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${transaction.size}</p>
                            <p className="text-sm text-muted-foreground">{transaction.structure}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Terms</p>
                            <p className="font-medium">{transaction.terms}</p>
                          </div>
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

        {/* Investment Strategies Tab */}
        <TabsContent value="strategies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Credit Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="grid gap-6">
                  {mockStrategies.map((strategy, index) => (
                    <Card key={index} className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{strategy.category}</h3>
                            <Badge variant="secondary">{strategy.deals} Transactions</Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {strategy.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {strategy.expertise.map((item, i) => (
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

        {/* Credit Expertise Tab */}
        <TabsContent value="expertise">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Credit Market Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Credit Analysis</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Financial Modeling</Badge>
                    <Badge variant="secondary">Credit Analysis</Badge>
                    <Badge variant="secondary">Risk Assessment</Badge>
                    <Badge variant="secondary">Industry Analysis</Badge>
                    <Badge variant="secondary">Covenant Analysis</Badge>
                    <Badge variant="secondary">Capital Structure</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Deal Structuring</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Term Sheets</Badge>
                    <Badge variant="secondary">Security Packages</Badge>
                    <Badge variant="secondary">Intercreditor Agreements</Badge>
                    <Badge variant="secondary">Covenant Design</Badge>
                    <Badge variant="secondary">Pricing Strategy</Badge>
                    <Badge variant="secondary">Documentation</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Portfolio Management</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Risk Monitoring</Badge>
                    <Badge variant="secondary">Workout Experience</Badge>
                    <Badge variant="secondary">Amendment Process</Badge>
                    <Badge variant="secondary">Portfolio Strategy</Badge>
                    <Badge variant="secondary">Credit Committee</Badge>
                    <Badge variant="secondary">ESG Integration</Badge>
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