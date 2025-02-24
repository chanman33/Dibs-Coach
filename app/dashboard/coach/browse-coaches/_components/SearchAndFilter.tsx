import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface SearchAndFilterProps {
  onSearch: (term: string) => void
  onFilter: (specialty: string) => void
  onPriceRangeChange?: (range: string) => void
  onSortChange?: (sort: string) => void
  specialties: string[]
  vertical?: boolean
}

export function SearchAndFilter({ 
  onSearch, 
  onFilter, 
  onPriceRangeChange, 
  onSortChange,
  specialties, 
  vertical = false 
}: SearchAndFilterProps) {
  const priceRanges = [
    { label: "$0 - $50/hour", value: "0-50" },
    { label: "$51 - $100/hour", value: "51-100" },
    { label: "$101+/hour", value: "101+" }
  ];

  const sortOptions = [
    { label: "Relevance", value: "relevance" },
    { label: "Highest Rated", value: "rating" },
    { label: "Price: Low to High", value: "price_low" },
    { label: "Price: High to Low", value: "price_high" }
  ];

  return (
    <div className={`flex ${vertical ? 'flex-col' : 'flex-col'} gap-4`}>
      <Input
        placeholder="Search coaches..."
        onChange={(e) => onSearch(e.target.value)}
        className="flex-grow"
      />
      <Select onValueChange={onFilter}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Specialty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Specialties</SelectItem>
          {specialties.map((specialty) => (
            <SelectItem key={specialty} value={specialty}>
              {specialty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={onPriceRangeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Price Range" />
        </SelectTrigger>
        <SelectContent>
          {priceRanges.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={onSortChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button className="w-full" onClick={() => onSearch('')}>
        Search
      </Button>
    </div>
  )
}

