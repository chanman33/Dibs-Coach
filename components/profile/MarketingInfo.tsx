import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateMarketingInfo, removeTestimonial } from "@/utils/actions/marketing-actions"
import { toast } from "sonner"
import type { MarketingInfo as MarketingInfoType } from "@/utils/types/marketing"

interface MarketingInformationProps {
  initialData?: MarketingInfoType;
  onSubmit?: (data: MarketingInfoType) => Promise<void>;
  isSubmitting?: boolean;
}

export default function MarketingInformation({ 
  initialData,
  onSubmit: externalSubmit,
  isSubmitting = false 
}: MarketingInformationProps) {
  const [formData, setFormData] = useState<MarketingInfoType>({
    slogan: initialData?.slogan ?? "",
    websiteUrl: initialData?.websiteUrl ?? "",
    facebookUrl: initialData?.facebookUrl ?? "",
    instagramUrl: initialData?.instagramUrl ?? "",
    linkedinUrl: initialData?.linkedinUrl ?? "",
    youtubeUrl: initialData?.youtubeUrl ?? "",
    marketingAreas: initialData?.marketingAreas ?? [],
    testimonials: initialData?.testimonials?.length ? initialData.testimonials : [{ author: "", content: "" }],
  })
  const [isRemoving, setIsRemoving] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let finalValue = value

    // Handle URL fields
    if (name.endsWith("Url") && value && !value.startsWith("http")) {
      finalValue = `https://${value}`
    }

    setFormData({ ...formData, [name]: finalValue })
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

  const handleRemoveTestimonial = async (index: number) => {
    try {
      setIsRemoving(true)
      
      // Only call the server action if there's more than one testimonial
      if (formData.testimonials.length > 1) {
        const result = await removeTestimonial({ index })
        
        if (result.error) {
          toast.error(result.error.message)
          return
        }

        if (result.data) {
          const updatedTestimonials = formData.testimonials.filter((_, i) => i !== index)
          setFormData(prev => ({
            ...prev,
            testimonials: updatedTestimonials
          }))
          toast.success("Testimonial removed successfully")
        }
      }
    } catch (error) {
      console.error("[REMOVE_TESTIMONIAL_ERROR]", error)
      toast.error("Failed to remove testimonial")
    } finally {
      setIsRemoving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Filter out empty testimonials before submitting
      const dataToSubmit = {
        ...formData,
        testimonials: formData.testimonials.filter(
          t => t.author.trim() !== "" || t.content.trim() !== ""
        ),
      }

      // Ensure at least one non-empty testimonial
      if (dataToSubmit.testimonials.length === 0) {
        dataToSubmit.testimonials = [{ author: "", content: "" }]
      }

      if (externalSubmit) {
        await externalSubmit(dataToSubmit)
      } else {
        const result = await updateMarketingInfo(dataToSubmit)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        toast.success("Marketing information updated successfully")
      }
    } catch (error) {
      toast.error("Failed to update marketing information")
      console.error("[FORM_ERROR]", error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="slogan">Byline or Slogan</Label>
        <Input 
          id="slogan" 
          name="slogan" 
          value={formData.slogan} 
          onChange={handleChange}
          placeholder="A short, catchy tagline that captures your unique value proposition (e.g., 'Turning Top Agents into Market Leaders')"
        />
      </div>
      <div>
        <Label htmlFor="websiteUrl">Website URL</Label>
        <Input 
          id="websiteUrl" 
          name="websiteUrl" 
          value={formData.websiteUrl || ""} 
          onChange={handleChange}
          placeholder="e.g. https://example.com"
        />
      </div>
      <div>
        <Label htmlFor="facebookUrl">Facebook URL</Label>
        <Input 
          id="facebookUrl" 
          name="facebookUrl" 
          value={formData.facebookUrl || ""} 
          onChange={handleChange}
          placeholder="e.g. https://facebook.com/profile"
        />
      </div>
      <div>
        <Label htmlFor="instagramUrl">Instagram URL</Label>
        <Input 
          id="instagramUrl" 
          name="instagramUrl" 
          value={formData.instagramUrl || ""} 
          onChange={handleChange}
          placeholder="e.g. https://instagram.com/profile"
        />
      </div>
      <div>
        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
        <Input 
          id="linkedinUrl" 
          name="linkedinUrl" 
          value={formData.linkedinUrl || ""} 
          onChange={handleChange}
          placeholder="e.g. https://linkedin.com/in/profile"
        />
      </div>
      <div>
        <Label htmlFor="youtubeUrl">YouTube URL</Label>
        <Input 
          id="youtubeUrl" 
          name="youtubeUrl" 
          value={formData.youtubeUrl || ""} 
          onChange={handleChange}
          placeholder="e.g. https://youtube.com/channel"
        />
      </div>
      <div>
        <Label htmlFor="marketingAreas">Marketing Areas (comma-separated)</Label>
        <Input
          id="marketingAreas"
          name="marketingAreas"
          value={Array.isArray(formData.marketingAreas) ? formData.marketingAreas.join(", ") : ""}
          onChange={(e) => {
            const areas = e.target.value.split(",").map(area => area.trim()).filter(Boolean);
            setFormData({ ...formData, marketingAreas: areas });
          }}
          placeholder="e.g. Downtown, Suburbs, Beachfront"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Testimonials</h3>
        {formData.testimonials.map((testimonial, index) => (
          <div key={index} className="space-y-2 p-4 border rounded mb-4">
            <div className="flex justify-between items-center">
              <Label>Testimonial {index + 1}</Label>
              {formData.testimonials.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveTestimonial(index)}
                  disabled={isRemoving}
                >
                  {isRemoving ? "Removing..." : "Remove"}
                </Button>
              )}
            </div>
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

