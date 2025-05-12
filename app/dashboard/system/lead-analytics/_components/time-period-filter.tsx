"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CalendarDays, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export type TimePeriod = "7d" | "30d" | "90d" | "1y" | "all"

interface TimePeriodFilterProps {
  initialPeriod?: TimePeriod
  onChange?: (period: TimePeriod) => void
}

const timePeriodLabels: Record<TimePeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "1y": "Last year",
  "all": "All time"
}

export function TimePeriodFilter({ initialPeriod = "30d", onChange }: TimePeriodFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(initialPeriod)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Update the selected period if initialPeriod changes
    if (initialPeriod && initialPeriod !== selectedPeriod) {
      setSelectedPeriod(initialPeriod)
    }
  }, [initialPeriod, selectedPeriod])

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period)
    
    // Update URL with the new period
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", period)
    
    // Replace the current URL with the new one
    router.push(`${pathname}?${params.toString()}`)
    
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
