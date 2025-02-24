import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'

export interface SearchAndFilterProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: string[]) => void;
  specialties?: string[];
  vertical?: boolean;
  variant?: 'public' | 'private';
}

export function SearchAndFilter({
  onSearch,
  onFilter,
  specialties = [],
  vertical = false,
  variant = 'public'
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  const handleFilterChange = (value: string) => {
    const newSpecialties = selectedSpecialties.includes(value)
      ? selectedSpecialties.filter(s => s !== value)
      : [...selectedSpecialties, value]
    
    setSelectedSpecialties(newSpecialties)
    onFilter?.(newSpecialties)
  }

  return (
    <div className={`space-y-4 ${vertical ? 'flex-col' : 'flex-row'}`}>
      <div className="flex-1">
        <Input
          placeholder="Search coaches..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full"
        />
      </div>
      
      {variant === 'private' && specialties?.length > 0 && (
        <div className="flex-1">
          <Select onValueChange={handleFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by specialty" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map(specialty => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
} 