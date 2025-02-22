import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const categories = [
  { name: "Residential", slug: "residential" },
  { name: "Commercial", slug: "commercial" },
  { name: "Investment", slug: "investment" },
  { name: "Property Management", slug: "property-management" },
  { name: "Real Estate Marketing", slug: "marketing" },
]

export function Categories() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <nav>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/coaches?category=${category.slug}`}
                  className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  )
}

