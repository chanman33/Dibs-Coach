'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { addDays, format, addMonths, subMonths } from 'date-fns';
import { DateRange as DayPickerDateRange, DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export type DateRange = DayPickerDateRange;

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (date: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({ 
  value, 
  onChange, 
  className,
  placeholder = "Pick a date range" 
}: DateRangePickerProps) {
  const [month, setMonth] = useState<Date>(value?.from || new Date());
  const [open, setOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    onChange?.(range);
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange?.(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <span className="flex-1">
                {format(value.from, 'LLL dd, y')} - {format(value.to, 'LLL dd, y')}
              </span>
            ) : (
              <span className="flex-1">{format(value.from, 'LLL dd, y')}</span>
            )
          ) : (
            <span className="flex-1">{placeholder}</span>
          )}
          {value && (
            <X 
              className="ml-2 h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
      >
        <div className="relative p-3">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setMonth(subMonths(month, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium">
              {format(month, 'MMMM yyyy')}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <DayPicker
            mode="range"
            defaultMonth={month}
            month={month}
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="flex flex-col sm:flex-row sm:space-x-4"
            showOutsideDays={false}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "hidden",
              table: "w-full border-collapse space-y-1",
              head_row: "grid grid-cols-7 gap-1",
              head_cell: "text-muted-foreground font-normal text-[0.8rem] text-center",
              row: "grid grid-cols-7 gap-1 mt-2",
              cell: cn(
                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                "[&:has([aria-selected])]:bg-accent"
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal rounded-md transition-colors hover:bg-accent",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "inline-flex items-center justify-center",
                "data-[selected]:bg-primary data-[selected]:text-primary-foreground",
                "data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground"
              ),
              day_range_start: "day-range-start rounded-l-md",
              day_range_end: "day-range-end rounded-r-md",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            modifiersStyles={{
              range_start: {},
              range_end: {},
              range_middle: {},
            }}
          />
          {value && (
            <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setOpen(false)}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 