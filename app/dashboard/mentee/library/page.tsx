import { Library } from "@/components/library/library"

export const metadata = {
  title: "Resource Library | Mentee Portal",
  description: "Access educational resources and partner courses to grow your real estate career.",
}

export default function MenteeLibraryPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <Library />
    </div>
  )
}
