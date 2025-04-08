'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '@/styles/date-picker.css'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps {
  startDate?: Date
  endDate?: Date
  onRangeChange?: (dates: [Date | null, Date | null]) => void
  disabled?: boolean
  disabledDates?: (date: Date) => boolean
  className?: string
  placeholder?: string
  formatString?: string
  maxRangeLength?: number
}

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  disabled = false,
  disabledDates,
  className,
  placeholder = 'Pick a date range',
  formatString = 'LLL dd, y',
  maxRangeLength
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [localStart, setLocalStart] = React.useState<Date | null>(startDate || null)
  const [localEnd, setLocalEnd] = React.useState<Date | null>(endDate || null)

  React.useEffect(() => {
    setLocalStart(startDate || null);
    setLocalEnd(endDate || null);
  }, [startDate, endDate]);

  const handleRangeChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;

    // If maxRangeLength is provided, limit the range
    if (maxRangeLength && start && end) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > maxRangeLength) {
        return;
      }
    }
    
    setLocalStart(start);
    setLocalEnd(end);
    
    if (start && end) {
      onRangeChange?.(dates);
      setIsOpen(false);
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalStart(null);
    setLocalEnd(null);
    onRangeChange?.([null, null]);
  }

  const handleApply = () => {
    onRangeChange?.([localStart, localEnd]);
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !startDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          onClick={() => setIsOpen(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {startDate ? (
            endDate ? (
              <span className="flex-1">
                {format(startDate, formatString)} - {format(endDate, formatString)}
              </span>
            ) : (
              <span className="flex-1">{format(startDate, formatString)}</span>
            )
          ) : (
            <span className="flex-1">{placeholder}</span>
          )}
          {(startDate || endDate) && (
            <X
              className="ml-2 h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <DatePicker
            selected={localStart}
            onChange={handleRangeChange}
            startDate={localStart}
            endDate={localEnd}
            selectsRange
            inline
            showPopperArrow={false}
            filterDate={disabledDates}
            calendarClassName="border-none shadow-none"
            dayClassName={() => "text-sm"}
            monthClassName={() => "font-medium text-center"}
            fixedHeight
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
          <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleClear(e)}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!localStart || !localEnd}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 