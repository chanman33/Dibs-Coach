import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateMarketingInfo } from "@/utils/actions/marketing-actions"
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
    websiteUrl: initialData?.websiteUrl ?? "",
    facebookUrl: initialData?.facebookUrl ?? "",
    instagramUrl: initialData?.instagramUrl ?? "",
    linkedinUrl: initialData?.linkedinUrl ?? "",
    youtubeUrl: initialData?.youtubeUrl ?? "",
    marketingAreas: initialData?.marketingAreas ?? [],
    testimonials: [],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let finalValue = value

    // Handle URL fields
    if (name.endsWith("Url") && value && !value.startsWith("http")) {
      finalValue = `https://${value}`
    }

    setFormData({ ...formData, [name]: finalValue })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const dataToSubmit = {
        ...formData,
        testimonials: []
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
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Marketing Information"}
      </Button>
    </form>
  )
}

