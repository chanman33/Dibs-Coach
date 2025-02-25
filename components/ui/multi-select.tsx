import * as React from "react";
import { X } from "lucide-react";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  options?: { label: string; value: string }[];
  value?: string[];
  onChange?: (value: string[]) => void;
  creatable?: boolean;
  placeholder?: string;
  label?: string;
}

export function MultiSelect({
  options = [],
  value = [],
  onChange,
  creatable = false,
  placeholder = "Select items...",
  label,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange?.(value.filter((i) => i !== item));
  };

  const handleSelect = (selectedValue: string) => {
    if (!value.includes(selectedValue)) {
      onChange?.([...value, selectedValue]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && value.length > 0) {
          handleUnselect(value[value.length - 1]);
        }
      }
      if (e.key === "Enter" && creatable && inputValue) {
        e.preventDefault();
        handleSelect(inputValue);
      }
    }
  };

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}
      <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
        <div
          className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
          onClick={() => setOpen(true)}
        >
          <div className="flex flex-wrap gap-1">
            {value.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(item);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(item)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => {
                setOpen(false);
                setInputValue("");
              }}
              onFocus={() => setOpen(true)}
              placeholder={value.length === 0 ? placeholder : ""}
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="relative mt-2">
          {open && (inputValue || options.length > 0) && (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandGroup className="h-full overflow-auto max-h-[200px]">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      handleSelect(option.value);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </CommandItem>
                ))}
                {creatable && inputValue && !options.find((option) => option.value === inputValue) && (
                  <CommandItem
                    onSelect={() => {
                      handleSelect(inputValue);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    Create "{inputValue}"
                  </CommandItem>
                )}
              </CommandGroup>
            </div>
          )}
        </div>
      </Command>
    </div>
  );
} 