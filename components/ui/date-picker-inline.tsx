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
    console.log('[DEBUG][DATE_PICKER] Date selected:', date);
    
    // If date is null, pass it through
    if (!date) {
      onSelect?.(undefined)
      return;
    }
    
    // Extra validation check - if disabledDates function exists, double-check that
    // we're not selecting a disabled date (should never happen, but as a safeguard)
    if (disabledDates && disabledDates(date)) {
      console.error('[DEBUG][DATE_PICKER] Prevented selection of disabled date:', 
        date.toISOString().split('T')[0]);
      return;
    }
    
    // Date is valid, pass it on
    onSelect?.(date)
  }

  // Create a wrapper for the disabledDates function to add logging
  const filterDateWithLogging = React.useCallback((date: Date) => {
    // If no disabledDates function provided, don't disable any dates
    if (!disabledDates) return false;
    
    const result = disabledDates(date);
    
    // Only log for visible dates to avoid console spam
    const isVisible = date.getDate() === 1 || date.getDate() === 15;
    if (isVisible) {
      console.log('[DEBUG][DATE_PICKER_FILTER]', {
        date: date.toISOString().split('T')[0],
        isDisabled: result
      });
    }
    
    return result;
  }, [disabledDates]);

  return (
    <div className={className}>
      <DatePicker
        selected={date}
        onChange={handleChange}
        disabled={disabled}
        filterDate={filterDateWithLogging}
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