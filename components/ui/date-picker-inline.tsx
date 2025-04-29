'use client'

import * as React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '@/styles/date-picker.css'
import { format, isSameDay } from 'date-fns'
import { useCallback } from 'react'

interface InlineDatePickerProps {
  date: Date | null;
  onSelect: (date: Date | null) => void;
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  bookableDates?: Date[];
  className?: string;
}

export function InlineDatePicker({ 
  date, 
  onSelect, 
  disabled = false,
  disabledDates,
  bookableDates = [],
  className
}: InlineDatePickerProps) {
  const handleChange = (newDate: Date | null) => {
    console.log('[DEBUG][INLINE_DATE_PICKER] Date changed:', {
      date: newDate ? format(newDate, 'yyyy-MM-dd') : null,
    });
    
    if (onSelect) {
      onSelect(newDate);
    }
  };

  const handleDateFilter = useCallback((dateToCheck: Date): boolean => {
    if (!disabledDates) return true;
    const isDisabled = disabledDates(dateToCheck);
    return !isDisabled;
  }, [disabledDates]);

  const getDayClassName = useCallback((currentDate: Date) => {
    const isSelected = date && isSameDay(currentDate, date);
    const isDisabledByWindow = disabledDates ? disabledDates(currentDate) : false;
    const isBookable = bookableDates.some(bookableDate => isSameDay(currentDate, bookableDate));
    
    let baseClass = '';
    
    if (isDisabledByWindow) {
      baseClass = 'date-disabled';
    } else if (isBookable) {
      baseClass = 'date-bookable';
    } else {
      baseClass = 'date-clickable';
    }
    
    const finalClassName = isSelected ? `${baseClass} date-selected` : baseClass;
    
    return finalClassName;
  }, [date, bookableDates, disabledDates]);

  return (
    <div className={className}>
      <DatePicker
        selected={date}
        onChange={handleChange}
        disabled={disabled}
        filterDate={handleDateFilter}
        inline
        calendarClassName="border rounded-md shadow-sm"
        dayClassName={getDayClassName}
        fixedHeight
        showMonthYearPicker={false}
        showFullMonthYearPicker={false}
        showTwoColumnMonthYearPicker={false}
        showPopperArrow={false}
        showMonthDropdown={false}
        showYearDropdown={false}
        dateFormat="MMMM yyyy"
      />
    </div>
  )
} 