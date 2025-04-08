'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
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

interface CustomDatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
  disabledDates?: (date: Date) => boolean
  className?: string
  placeholderText?: string
  formatString?: string
}

export function CustomDatePicker({ 
  date, 
  onSelect, 
  disabled = false,
  disabledDates,
  className,
  placeholderText = "Pick a date",
  formatString = 'PPP' // This is a date-fns format string
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSelect = (date: Date | null) => {
    onSelect?.(date || undefined)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
          onClick={() => setIsOpen(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, formatString) : <span>{placeholderText}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <DatePicker
            selected={date}
            onChange={handleSelect}
            disabled={disabled}
            filterDate={disabledDates}
            inline
            showPopperArrow={false}
            calendarClassName="border-none shadow-none"
            dayClassName={() => "text-sm"}
            fixedHeight
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
} 