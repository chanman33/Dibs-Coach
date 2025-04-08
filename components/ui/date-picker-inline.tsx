'use client'

import * as React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '@/styles/date-picker.css'

interface InlineDatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
  disabledDates?: (date: Date) => boolean
  className?: string
}

export function InlineDatePicker({ 
  date, 
  onSelect, 
  disabled = false,
  disabledDates,
  className
}: InlineDatePickerProps) {
  const handleChange = (date: Date | null) => {
    onSelect?.(date || undefined)
  }

  return (
    <div className={className}>
      <DatePicker
        selected={date}
        onChange={handleChange}
        disabled={disabled}
        filterDate={disabledDates}
        inline
        calendarClassName="border rounded-md shadow-sm"
        dayClassName={() => "text-sm"}
        fixedHeight
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
      />
    </div>
  )
} 