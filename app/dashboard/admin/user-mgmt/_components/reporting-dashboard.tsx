"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Download,
  FileSpreadsheet,
  FileText,
  FilePieChart,
  Calendar,
} from "lucide-react"
import { DateRangePicker } from "@/components/ui/date-range-picker"

export function ReportingDashboard() {
  const handleGenerateReport = (type: string) => {
    // TODO: Implement report generation
    console.log(`Generating ${type} report...`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <DateRangePicker />
              <Button variant="outline">Apply Range</Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                    <h3 className="text-lg font-medium">User Activity Report</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Detailed user engagement and activity metrics
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleGenerateReport("activity")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <FilePieChart className="h-8 w-8 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Analytics Report</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Comprehensive analytics and insights
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleGenerateReport("analytics")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Session Report</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Session completion and revenue data
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleGenerateReport("sessions")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Placeholder for recent reports - to be implemented */}
            <div className="text-sm text-muted-foreground">
              No reports generated yet.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 