'use client'

import * as React from 'react'
import { InlineDatePicker } from '@/components/ui/date-picker-inline'

interface CalendarProps {
  mode?: 'single'
  selected?: Date | null
  onSelect?: (date: Date | null) => void
  disabled?: boolean
  disabledDates?: (date: Date) => boolean
  className?: string
}

export function Calendar({
  mode = 'single',
  selected = null,
  onSelect = () => {},
  disabled,
  disabledDates,
  className
}: CalendarProps) {
  return (
    <InlineDatePicker
      date={selected}
      onSelect={onSelect}
      disabled={disabled}
      disabledDates={disabledDates}
      className={className}
    />
  )
} 