import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { SearchBarProps } from './types';
import { cn } from '@/lib/utils';

export function SearchBar({
  onSearch,
  placeholder = 'Search coaches by name, specialty, or expertise...',
  initialQuery = '',
  className,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, onSearch]);

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn(
        'relative flex items-center rounded-lg bg-background border shadow-sm',
        'transition-shadow duration-200 hover:shadow-md'
      )}>
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'pl-9 pr-12 py-6 border-0',
            'placeholder:text-muted-foreground/70',
            'focus-visible:ring-0',
            'text-base'
          )}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 h-8 w-8 p-0 hover:bg-muted"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    </div>
  );
} 