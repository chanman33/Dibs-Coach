import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Home, 
  Building, 
  LandPlot, 
  PiggyBank, 
  FileText, 
  Building2,
  Landmark,
  Briefcase,
  TrendingUp,
  HeartHandshake,
  Award,
  Lightbulb,
  BarChart,
  Share2
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FilterSidebarProps, CoachFilters } from './types';
import { cn } from '@/lib/utils';
import { ChevronDown, X } from 'lucide-react';
import { REAL_ESTATE_DOMAINS, ACTIVE_DOMAINS, RealEstateDomain, SpecialtyCategory, COACH_SPECIALTIES } from '@/utils/types/coach';

const INDUSTRY_DOMAINS = [
  { label: 'Realtor', value: 'realtor', icon: Home },
  { label: 'Mortgage Officer', value: 'mortgage', icon: Landmark },
  { label: 'Commercial Real Estate', value: 'commercial_re', icon: Building },
  { label: 'Property Management', value: 'property_manager', icon: LandPlot },
  { label: 'Investor', value: 'investor', icon: PiggyBank },
  { label: 'Private Credit', value: 'private_credit', icon: FileText },
  { label: 'Title & Escrow', value: 'title_escrow', icon: Building2 },
];

// Map the industry domains to their corresponding REAL_ESTATE_DOMAINS values
const DOMAIN_VALUE_MAP: Record<string, RealEstateDomain> = {
  'realtor': REAL_ESTATE_DOMAINS.REALTOR,
  'mortgage': REAL_ESTATE_DOMAINS.MORTGAGE,
  'commercial_re': REAL_ESTATE_DOMAINS.COMMERCIAL,
  'property_manager': REAL_ESTATE_DOMAINS.PROPERTY_MANAGER,
  'investor': REAL_ESTATE_DOMAINS.INVESTOR,
  'private_credit': REAL_ESTATE_DOMAINS.PRIVATE_CREDIT,
  'title_escrow': REAL_ESTATE_DOMAINS.TITLE_ESCROW,
};

// Create a reverse mapping for display purposes
const REAL_ESTATE_DOMAIN_DISPLAY: Record<RealEstateDomain, { label: string, icon: React.ComponentType<{ className?: string }> }> = {
  [REAL_ESTATE_DOMAINS.REALTOR]: { label: 'Realtor', icon: Home },
  [REAL_ESTATE_DOMAINS.MORTGAGE]: { label: 'Mortgage Officer', icon: Landmark },
  [REAL_ESTATE_DOMAINS.COMMERCIAL]: { label: 'Commercial Real Estate', icon: Building },
  [REAL_ESTATE_DOMAINS.PROPERTY_MANAGER]: { label: 'Property Management', icon: LandPlot },
  [REAL_ESTATE_DOMAINS.INVESTOR]: { label: 'Investor', icon: PiggyBank },
  [REAL_ESTATE_DOMAINS.PRIVATE_CREDIT]: { label: 'Private Credit', icon: FileText },
  [REAL_ESTATE_DOMAINS.TITLE_ESCROW]: { label: 'Title & Escrow', icon: Building2 },
  [REAL_ESTATE_DOMAINS.INSURANCE]: { label: 'Insurance', icon: Briefcase },
};

// Define skill category icons
const SKILL_CATEGORY_ICONS: Record<SpecialtyCategory, React.ComponentType<{ className?: string }>> = {
  BUSINESS_DEVELOPMENT: TrendingUp,
  BUSINESS_OPERATIONS: Building2,
  CLIENT_RELATIONS: HeartHandshake,
  PROFESSIONAL_DEVELOPMENT: Award,
  MARKET_INNOVATION: Lightbulb,
  ECONOMIC_MASTERY: BarChart,
  SOCIAL_MEDIA: Share2,
  REALTOR: Home,
  MORTGAGE_OFFICER: Landmark,
  COMMERCIAL_RE: Building,
  PROPERTY_MANAGER: LandPlot,
  INVESTOR: PiggyBank,
  PRIVATE_CREDIT: FileText,
  TITLE_ESCROW: Building2,
};

// Helper to convert category names to display format
const formatCategoryLabel = (category: string): string => {
  const baseLabel = category
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

  // Add "Skills" to real estate domain categories
  const realEstateDomains = [
    'REALTOR',
    'MORTGAGE_OFFICER',
    'COMMERCIAL_RE',
    'PROPERTY_MANAGER',
    'INVESTOR',
    'PRIVATE_CREDIT',
    'TITLE_ESCROW'
  ];

  // Special cases for shorter labels
  if (category === 'COMMERCIAL_RE') {
    return 'Commercial Skills';
  }
  if (category === 'MORTGAGE_OFFICER') {
    return 'Mortgage Skills';
  }

  return realEstateDomains.includes(category) ? `${baseLabel} Skills` : baseLabel;
};

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
  skills = [],
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<CoachFilters>(initialFilters);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [openSections, setOpenSections] = useState({
    realEstateDomains: true, // Real Estate Domains is open by default
    price: false,  // Price is collapsed by default
    rating: false, // Rating is collapsed by default
    skillCategories: false, // Skill Categories is collapsed by default
  });

  // Get active real estate domains
  const activeRealEstateDomains = Object.entries(REAL_ESTATE_DOMAINS)
    .filter(([_, value]) => ACTIVE_DOMAINS[value])
    .map(([_, value]) => value);

  // Get available skill categories
  const availableSkillCategories = [
    'BUSINESS_DEVELOPMENT',
    'BUSINESS_OPERATIONS',
    'CLIENT_RELATIONS',
    'PROFESSIONAL_DEVELOPMENT',
    'MARKET_INNOVATION',
    'ECONOMIC_MASTERY',
    'SOCIAL_MEDIA',
    'REALTOR',
    'MORTGAGE_OFFICER',
    'COMMERCIAL_RE',
    'PROPERTY_MANAGER',
    'INVESTOR',
    'PRIVATE_CREDIT',
    'TITLE_ESCROW'
  ] as SpecialtyCategory[];

  // Update filters when initialFilters prop changes
  useEffect(() => {
    setFilters(initialFilters);
    // Also update open sections based on what's selected
    if (initialFilters.skillCategories?.length) {
      setOpenSections(prev => ({ ...prev, skillCategories: true }));
    }
    if (initialFilters.realEstateDomain?.length) {
      setOpenSections(prev => ({ ...prev, realEstateDomains: true }));
    }
    if (initialFilters.priceRange) {
      setOpenSections(prev => ({ ...prev, price: true }));
    }
    if (initialFilters.rating) {
      setOpenSections(prev => ({ ...prev, rating: true }));
    }
  }, [initialFilters]);

  useEffect(() => {
    const count = Object.values(filters).reduce((acc, value) => {
      if (Array.isArray(value)) {
        return acc + value.length;
      }
      return acc + (value ? 1 : 0);
    }, 0);
    setActiveFilterCount(count);
  }, [filters]);

  const handleRealEstateDomainChange = (checked: boolean, domain: RealEstateDomain) => {
    const updatedRealEstateDomains = checked
      ? [...(filters.realEstateDomain || []), domain]
      : (filters.realEstateDomain || []).filter((d) => d !== domain);

    setFilters((prev) => ({
      ...prev,
      realEstateDomain: updatedRealEstateDomains,
    }));
  };

  const handleSkillCategoryChange = (checked: boolean, category: SpecialtyCategory) => {
    const updatedSkillCategories = checked
      ? [...(filters.skillCategories || []), category]
      : (filters.skillCategories || []).filter((c) => c !== category);

    setFilters((prev) => ({
      ...prev,
      skillCategories: updatedSkillCategories,
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
        {/* Real Estate Domains Filter */}
        <Collapsible
          open={openSections.realEstateDomains}
          className="space-y-2"
        >
          {renderFilterHeader('Real Estate Domains', 'realEstateDomains', filters.realEstateDomain?.length)}
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-1 gap-1.5">
              {activeRealEstateDomains.map((domain) => {
                const domainInfo = REAL_ESTATE_DOMAIN_DISPLAY[domain];
                if (!domainInfo) return null;
                
                const Icon = domainInfo.icon;
                const isSelected = (filters.realEstateDomain || []).includes(domain);
                
                return (
                  <button
                    key={domain}
                    onClick={() => handleRealEstateDomainChange(!isSelected, domain)}
                    className={cn(
                      "flex items-center w-full px-2 py-1.5 rounded-md text-sm",
                      "hover:bg-muted/50 transition-colors",
                      isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{domainInfo.label}</span>
                  </button>
                );
              })}
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

        {/* Skill Categories Filter - Moved to bottom */}
        <Collapsible
          open={openSections.skillCategories}
          className="space-y-2"
        >
          {renderFilterHeader('Skill Categories', 'skillCategories', filters.skillCategories?.length)}
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-1 gap-1.5">
              {availableSkillCategories.map((category) => {
                const Icon = SKILL_CATEGORY_ICONS[category] || Lightbulb;
                const isSelected = (filters.skillCategories || []).includes(category);
                const label = formatCategoryLabel(category);
                
                return (
                  <button
                    key={category}
                    onClick={() => handleSkillCategoryChange(!isSelected, category)}
                    className={cn(
                      "flex items-center w-full px-2 py-1.5 rounded-md text-sm",
                      "hover:bg-muted/50 transition-colors",
                      isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
} 