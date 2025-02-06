import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function MarketingInformation({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    slogan: "",
    websiteUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
    marketingAreas: "",
    testimonials: [{ author: "", content: "" }],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleTestimonialChange = (index: number, field: string, value: string) => {
    const updatedTestimonials = formData.testimonials.map((testimonial, i) =>
      i === index ? { ...testimonial, [field]: value } : testimonial,
    )
    setFormData({ ...formData, testimonials: updatedTestimonials })
  }

  const addTestimonial = () => {
    setFormData({
      ...formData,
      testimonials: [...formData.testimonials, { author: "", content: "" }],
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="slogan">Byline or Slogan</Label>
        <Input id="slogan" name="slogan" value={formData.slogan} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="websiteUrl">Website URL</Label>
        <Input id="websiteUrl" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="facebookUrl">Facebook URL</Label>
        <Input id="facebookUrl" name="facebookUrl" value={formData.facebookUrl} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="instagramUrl">Instagram URL</Label>
        <Input id="instagramUrl" name="instagramUrl" value={formData.instagramUrl} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
        <Input id="linkedinUrl" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="youtubeUrl">YouTube URL</Label>
        <Input id="youtubeUrl" name="youtubeUrl" value={formData.youtubeUrl} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="marketingAreas">Marketing Areas (comma-separated)</Label>
        <Input
          id="marketingAreas"
          name="marketingAreas"
          value={formData.marketingAreas}
          onChange={handleChange}
          placeholder="e.g. Downtown, Suburbs, Beachfront"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Testimonials</h3>
        {formData.testimonials.map((testimonial, index) => (
          <div key={index} className="space-y-2 p-4 border rounded mb-4">
            <Input
              placeholder="Author"
              value={testimonial.author}
              onChange={(e) => handleTestimonialChange(index, "author", e.target.value)}
            />
            <Textarea
              placeholder="Testimonial Content"
              value={testimonial.content}
              onChange={(e) => handleTestimonialChange(index, "content", e.target.value)}
            />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addTestimonial}>
          Add Another Testimonial
        </Button>
      </div>
      <Button type="submit">Save Marketing Information</Button>
    </form>
  )
}

