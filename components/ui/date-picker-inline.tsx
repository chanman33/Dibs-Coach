'use client'

import * as React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '@/styles/date-picker.css'
import { format } from 'date-fns'
import { useCallback } from 'react'

interface InlineDatePickerProps {
  date: Date | null;
  onSelect: (date: Date | null) => void;
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  className?: string;
}

export function InlineDatePicker({ 
  date, 
  onSelect, 
  disabled = false,
  disabledDates,
  className
}: InlineDatePickerProps) {
  const handleSelect = (date: Date | undefined) => {
    if (onSelect) {
      onSelect(date || null);
    }
  };

  const handleChange = (date: Date | null) => {
    console.log('[DEBUG][DATE_PICKER] Date selected:', date);
    if (onSelect) {
      onSelect(date);
    }
  };

  const handleDateFilter = useCallback((date: Date): boolean => {
    // If no disabledDates function provided, don't disable any dates
    if (!disabledDates) return true;
    
    const shouldBeDisabled = disabledDates(date);
    const willBeEnabled = !shouldBeDisabled;
    
    // Only log when a date is being enabled (reduces noise)
    // if (willBeEnabled) {
    //   console.log('[DEBUG][DATE_PICKER] Enabling date:', {
    //     date: format(date, 'yyyy-MM-dd')
    //   });
    // }
    
    return willBeEnabled;
  }, [disabledDates]);

  return (
    <div className={className}>
      <DatePicker
        selected={date}
        onChange={handleChange}
        disabled={disabled}
        filterDate={handleDateFilter}
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