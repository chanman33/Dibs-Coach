"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function SearchAndFilter() {
  const [searchTerm, setSearchTerm] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [sortBy, setSortBy] = useState("relevance")

  const handleSearch = () => {
    console.log("Searching with:", { searchTerm, specialty, priceRange, sortBy })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Filter Coaches</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="text"
          placeholder="Search coaches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger>
            <SelectValue placeholder="Select Specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="investment">Investment</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger>
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-50">$0 - $50/hour</SelectItem>
            <SelectItem value="51-100">$51 - $100/hour</SelectItem>
            <SelectItem value="101+">$101+/hour</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} className="w-full">
          Search
        </Button>
      </CardContent>
    </Card>
  )
}

