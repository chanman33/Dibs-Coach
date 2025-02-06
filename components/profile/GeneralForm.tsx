import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function GeneralForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    brokerage: "",
    yearsOfExperience: "",
    bio: "",
    primaryMarket: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="licenseNumber">License Number</Label>
        <Input
          id="licenseNumber"
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="brokerage">Brokerage</Label>
        <Input id="brokerage" name="brokerage" value={formData.brokerage} onChange={handleChange} required />
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
        />
      </div>
      <div>
        <Label htmlFor="bio">Professional Bio</Label>
        <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} />
      </div>
      <Button type="submit">Save General Information</Button>
    </form>
  )
}

