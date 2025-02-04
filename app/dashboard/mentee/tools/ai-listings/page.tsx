import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import SharedAiListings from "@/components/tools/ai-listings/page"

export default async function MenteeAiListings() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return <SharedAiListings />
} 