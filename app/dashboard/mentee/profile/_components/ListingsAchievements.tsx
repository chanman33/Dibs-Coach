import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ListingsAndAchievements({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [listings, setListings] = useState([{ address: "", price: "", status: "" }])
  const [achievements, setAchievements] = useState([{ year: "", description: "" }])

  const handleListingChange = (index: number, field: string, value: string) => {
    const updatedListings = listings.map((listing, i) => (i === index ? { ...listing, [field]: value } : listing))
    setListings(updatedListings)
  }

  const handleAchievementChange = (index: number, field: string, value: string) => {
    const updatedAchievements = achievements.map((achievement, i) =>
      i === index ? { ...achievement, [field]: value } : achievement,
    )
    setAchievements(updatedAchievements)
  }

  const addListing = () => {
    setListings([...listings, { address: "", price: "", status: "" }])
  }

  const addAchievement = () => {
    setAchievements([...achievements, { year: "", description: "" }])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ listings, achievements })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Featured Listings</h3>
        {listings.map((listing, index) => (
          <div key={index} className="space-y-2 p-4 border rounded mb-4">
            <Input
              placeholder="Address"
              value={listing.address}
              onChange={(e) => handleListingChange(index, "address", e.target.value)}
            />
            <Input
              placeholder="Price"
              value={listing.price}
              onChange={(e) => handleListingChange(index, "price", e.target.value)}
            />
            <Input
              placeholder="Status (e.g., For Sale, Sold, Pending)"
              value={listing.status}
              onChange={(e) => handleListingChange(index, "status", e.target.value)}
            />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addListing}>
          Add Another Listing
        </Button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Achievements & Awards</h3>
        {achievements.map((achievement, index) => (
          <div key={index} className="space-y-2 p-4 border rounded mb-4">
            <Input
              placeholder="Year"
              value={achievement.year}
              onChange={(e) => handleAchievementChange(index, "year", e.target.value)}
            />
            <Textarea
              placeholder="Achievement Description"
              value={achievement.description}
              onChange={(e) => handleAchievementChange(index, "description", e.target.value)}
            />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addAchievement}>
          Add Another Achievement
        </Button>
      </div>

      <Button type="submit">Save Listings & Achievements</Button>
    </form>
  )
}

