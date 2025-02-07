import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface UserData {
  firstName?: string | null
  lastName?: string | null
  displayName?: string | null
  licenseNumber?: string
  companyName?: string
  yearsOfExperience?: string
  bio?: string
  primaryMarket?: string
}

export default function GeneralForm({ 
  onSubmit, 
  initialData,
  isSubmitting = false
}: { 
  onSubmit: (data: any) => void
  initialData?: UserData
  isSubmitting?: boolean
}) {
  const [formData, setFormData] = useState({
    displayName: "",
    licenseNumber: "",
    companyName: "",
    yearsOfExperience: "",
    bio: "",
    primaryMarket: "",
  })

  useEffect(() => {
    if (initialData) {
      // Set default display name if not already set
      const defaultDisplayName = initialData.displayName || 
        (initialData.firstName || initialData.lastName ? 
          `${initialData.firstName || ''} ${initialData.lastName || ''}`.trim() : 
          '')

      setFormData({
        displayName: defaultDisplayName,
        licenseNumber: initialData.licenseNumber || "",
        companyName: initialData.companyName || "",
        yearsOfExperience: initialData.yearsOfExperience || "",
        bio: initialData.bio || "",
        primaryMarket: initialData.primaryMarket || "",
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="displayName">Profile Display Name</Label>
        <Input 
          id="displayName" 
          name="displayName" 
          value={formData.displayName} 
          onChange={handleChange} 
          required 
          placeholder="Enter your preferred display name"
          disabled={isSubmitting}
        />
        <p className="text-sm text-muted-foreground mt-1">
          This is how your name will appear publicly on your profile. By default, we use your full name.
        </p>
      </div>
      <div>
        <Label htmlFor="licenseNumber">License Number</Label>
        <Input
          id="licenseNumber"
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="companyName">Brokerage</Label>
        <Input 
          id="companyName" 
          name="companyName" 
          value={formData.companyName} 
          onChange={handleChange} 
          required 
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
        <Input
          id="yearsOfExperience"
          name="yearsOfExperience"
          type="number"
          value={formData.yearsOfExperience}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          min="0"
          max="100"
        />
      </div>
      <div>
        <Label htmlFor="primaryMarket">Primary Market</Label>
        <Input
          id="primaryMarket"
          name="primaryMarket"
          value={formData.primaryMarket}
          onChange={handleChange}
          placeholder="e.g. Greater Los Angeles Area"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="bio">Professional Bio</Label>
        <Textarea 
          id="bio" 
          name="bio" 
          value={formData.bio} 
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="Tell us about your professional background and expertise"
          rows={4}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save General Information"}
      </Button>
    </form>
  )
}

