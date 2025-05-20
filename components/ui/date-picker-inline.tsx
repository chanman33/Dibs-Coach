'use client'

import * as React from 'react'
import DatePicker, { ReactDatePickerCustomHeaderProps } from 'react-datepicker'
import { format, isSameDay, getMonth, getYear } from 'date-fns'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

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

  const minNavDate = new Date(1900, 0, 1);
  const maxNavDate = new Date(2100, 0, 1);

  const handleMonthChange = (newMonthDate: Date) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG][INLINE_DATE_PICKER] onMonthChange event. New month:', format(newMonthDate, 'yyyy-MM'));
    }
  };

  const CustomHeader = ({ 
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled
  }: ReactDatePickerCustomHeaderProps) => (
    <div className="flex items-center justify-between px-2 py-2 relative z-50">
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        aria-label="Previous Month"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <span className="flex-grow text-center text-sm font-medium">
        {format(date, "MMMM yyyy")}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        aria-label="Next Month"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className={className}>
      <DatePicker
        selected={date}
        onChange={handleChange}
        disabled={disabled}
        filterDate={handleDateFilter}
        minDate={minNavDate}
        maxDate={maxNavDate}
        onMonthChange={handleMonthChange}
        renderCustomHeader={CustomHeader}
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