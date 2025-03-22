import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import SharedIncomeCalc from "@/components/tools/income-calc/page"

export default async function MenteeIncomeCalc() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Implement exactly like the coach portal for consistent scrollbar behavior
  return <SharedIncomeCalc />
} 