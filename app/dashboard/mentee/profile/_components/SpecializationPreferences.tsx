import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

export default function SpecializationPreferences({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    propertyTypes: [] as string[],
    specializations: [] as string[],
    certifications: [] as string[],
    languages: [] as string[],
    geographicFocus: {
      cities: [] as string[],
      neighborhoods: [] as string[],
      counties: [] as string[],
    },
  })

  const handleCheckboxChange = (
    category: 'propertyTypes' | 'specializations' | 'certifications' | 'languages',
    item: string,
    checked: boolean
  ) => {
    setFormData({
      ...formData,
      [category]: checked
        ? [...formData[category], item]
        : formData[category].filter((i) => i !== item),
    })
  }

  const handleInputChange = (category: string, value: string) => {
    setFormData({
      ...formData,
      [category]: value.split(",").map((item) => item.trim()),
    })
  }

  const handleGeographicFocusChange = (category: keyof typeof formData.geographicFocus, value: string) => {
    setFormData({
      ...formData,
      geographicFocus: {
        ...formData.geographicFocus,
        [category]: value.split(",").map((item) => item.trim()),
      },
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Property Types</Label>
        <div className="space-y-2">
          {["Residential", "Commercial", "Industrial", "Land", "Luxury"].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`property-${type}`}
                checked={formData.propertyTypes.includes(type)}
                onCheckedChange={(checked) => handleCheckboxChange("propertyTypes", type, checked as boolean)}
              />
              <Label htmlFor={`property-${type}`}>{type}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Specializations</Label>
        <div className="space-y-2">
          {["First-time Buyers", "Relocation", "Investment Properties", "Foreclosures", "Short Sales"].map((spec) => (
            <div key={spec} className="flex items-center space-x-2">
              <Checkbox
                id={`spec-${spec}`}
                checked={formData.specializations.includes(spec)}
                onCheckedChange={(checked) => handleCheckboxChange("specializations", spec, checked as boolean)}
              />
              <Label htmlFor={`spec-${spec}`}>{spec}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Geographic Focus</Label>
        <div className="space-y-2">
          <div>
            <Label htmlFor="cities">Cities</Label>
            <Input
              id="cities"
              value={formData.geographicFocus.cities.join(", ")}
              onChange={(e) => handleGeographicFocusChange("cities", e.target.value)}
              placeholder="e.g. Los Angeles, Santa Monica, Beverly Hills"
            />
          </div>
          <div>
            <Label htmlFor="neighborhoods">Neighborhoods</Label>
            <Input
              id="neighborhoods"
              value={formData.geographicFocus.neighborhoods.join(", ")}
              onChange={(e) => handleGeographicFocusChange("neighborhoods", e.target.value)}
              placeholder="e.g. Downtown, Hollywood Hills, Bel Air"
            />
          </div>
          <div>
            <Label htmlFor="counties">Counties</Label>
            <Input
              id="counties"
              value={formData.geographicFocus.counties.join(", ")}
              onChange={(e) => handleGeographicFocusChange("counties", e.target.value)}
              placeholder="e.g. Los Angeles County, Orange County"
            />
          </div>
        </div>
      </div>
      <div>
        <Label htmlFor="certifications">Certifications (comma-separated)</Label>
        <Input
          id="certifications"
          value={formData.certifications.join(", ")}
          onChange={(e) => handleInputChange("certifications", e.target.value)}
          placeholder="e.g. CRS, ABR, SRES"
        />
      </div>
      <div>
        <Label htmlFor="languages">Languages Spoken (comma-separated)</Label>
        <Input
          id="languages"
          value={formData.languages.join(", ")}
          onChange={(e) => handleInputChange("languages", e.target.value)}
          placeholder="e.g. English, Spanish, French"
        />
      </div>
      <Button type="submit">Save Specializations & Expertise</Button>
    </form>
  )
}

