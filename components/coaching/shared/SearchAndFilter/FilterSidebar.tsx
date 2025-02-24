import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FilterSidebarProps, CoachFilters } from './types';
import { cn } from '@/lib/utils';
import { ChevronDown, X } from 'lucide-react';

const INDUSTRY_DOMAINS = [
  { label: 'Realtor', value: 'realtor' },
  { label: 'Mortgage', value: 'mortgage' },
  { label: 'Property Manager', value: 'property_manager' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Investor', value: 'investor' },
];

const PRICE_RANGES = [
  { label: '$50 - $100/hr', value: '50-100', count: 45 },
  { label: '$100 - $200/hr', value: '100-200', count: 38 },
  { label: '$200 - $300/hr', value: '200-300', count: 25 },
  { label: '$300 - $400/hr', value: '300-400', count: 12 },
  { label: 'Over $400/hr', value: '400-1000', count: 5 },
];

const RATINGS = [
  { label: '5 stars', value: '5' },
  { label: '4 stars & up', value: '4' },
  { label: '3 stars & up', value: '3' },
];

export function FilterSidebar({
  onFiltersChange,
  initialFilters = {},
  className,
  domains,
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<CoachFilters>(initialFilters);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [openSections, setOpenSections] = useState({
    domains: true, // Industry dropdown is open by default
    price: false,  // Price is collapsed by default
    rating: false, // Rating is collapsed by default
  });

  // Use provided domains or fall back to default industry domains
  const displayDomains = domains && domains.length > 0 ? domains : INDUSTRY_DOMAINS;

  useEffect(() => {
    const count = Object.values(filters).reduce((acc, value) => {
      if (Array.isArray(value)) {
        return acc + value.length;
      }
      return acc + (value ? 1 : 0);
    }, 0);
    setActiveFilterCount(count);
  }, [filters]);

  const handleDomainChange = (checked: boolean, domain: string) => {
    const updatedDomains = checked
      ? [...(filters.domain || []), domain]
      : (filters.domain || []).filter((d) => d !== domain);

    setFilters((prev) => ({
      ...prev,
      domain: updatedDomains,
    }));
  };

  const handlePriceRangeChange = (value: string) => {
    const [min, max] = value.split('-').map(Number);
    setFilters((prev) => ({
      ...prev,
      priceRange: prev.priceRange?.min === min && prev.priceRange?.max === max ? undefined : { min, max },
    }));
  };

  const handleRatingChange = (value: string) => {
    const rating = Number(value);
    setFilters((prev) => ({
      ...prev,
      rating: prev.rating === rating ? undefined : rating,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onFiltersChange(filters);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters, onFiltersChange]);

  const renderFilterHeader = (
    title: string,
    section: keyof typeof openSections,
    activeCount: number = 0
  ) => (
    <CollapsibleTrigger
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary"
    >
      <div className="flex items-center gap-2">
        {title}
        {activeCount > 0 && (
          <Badge variant="secondary" className="h-5 px-2">
            {activeCount}
          </Badge>
        )}
      </div>
      <ChevronDown
        className={cn(
          "h-4 w-4 transition-transform",
          openSections[section] && "transform rotate-180"
        )}
      />
    </CollapsibleTrigger>
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < rating ? "fill-primary text-primary" : "fill-muted text-muted"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Active Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-2">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <Collapsible
          open={openSections.domains}
          className="space-y-2"
        >
          {renderFilterHeader('Industry', 'domains', filters.domain?.length)}
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-1 gap-2">
              {displayDomains.map((domain) => (
                <div
                  key={domain.value}
                  className="flex items-center space-x-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`domain-${domain.value}`}
                    checked={(filters.domain || []).includes(domain.value)}
                    onCheckedChange={(checked) =>
                      handleDomainChange(checked as boolean, domain.value)
                    }
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor={`domain-${domain.value}`}
                    className="flex-grow text-sm cursor-pointer"
                  >
                    {domain.label}
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={openSections.price}
          className="space-y-2"
        >
          {renderFilterHeader('Price Range', 'price', filters.priceRange ? 1 : 0)}
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-1 gap-2">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handlePriceRangeChange(range.value)}
                  className={cn(
                    "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm",
                    "hover:bg-muted/50 transition-colors",
                    filters.priceRange?.min === Number(range.value.split('-')[0]) &&
                    filters.priceRange?.max === Number(range.value.split('-')[1])
                      ? "bg-primary/10 text-primary"
                      : ""
                  )}
                >
                  <span>{range.label}</span>
                  <Badge variant="secondary" className="ml-2">
                    {range.count}
                  </Badge>
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={openSections.rating}
          className="space-y-2"
        >
          {renderFilterHeader('Rating', 'rating', filters.rating ? 1 : 0)}
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-1 gap-2">
              {RATINGS.map((rating) => (
                <button
                  key={rating.value}
                  onClick={() => handleRatingChange(rating.value)}
                  className={cn(
                    "flex items-center justify-between w-full px-2 py-1.5 rounded-md",
                    "hover:bg-muted/50 transition-colors",
                    filters.rating === Number(rating.value)
                      ? "bg-primary/10"
                      : ""
                  )}
                >
                  <div className="flex items-center gap-2">
                    {renderStars(Number(rating.value))}
                    <span className="text-sm">{rating.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
} 