"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CalendarDays, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TimePeriod = "7d" | "30d" | "90d" | "1y" | "all"

interface TimePeriodFilterProps {
  onChange?: (period: TimePeriod) => void
}

const timePeriodLabels: Record<TimePeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "1y": "Last year",
  "all": "All time"
}

export function TimePeriodFilter({ onChange }: TimePeriodFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30d")

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period)
    if (onChange) {
      onChange(period)
    }
  }

  return (
    <Card className="border shadow-sm w-full sm:w-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between border-0 bg-white hover:bg-gray-50 h-[60px] px-4"
          >
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Time Period</span>
              <div className="flex items-center mt-1">
                <CalendarDays className="mr-2 h-4 w-4 text-[#4472C4]" />
                <span className="font-medium">{timePeriodLabels[selectedPeriod]}</span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {Object.entries(timePeriodLabels).map(([value, label]) => (
            <DropdownMenuItem
              key={value}
              className={`cursor-pointer ${selectedPeriod === value ? 'bg-[#EBF1FA] text-[#4472C4] font-medium' : ''}`}
              onClick={() => handlePeriodChange(value as TimePeriod)}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  )
} 