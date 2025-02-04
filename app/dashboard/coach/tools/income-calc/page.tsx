import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import SharedIncomeCalc from "@/components/tools/income-calc/page"

export default async function CoachIncomeCalc() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return <SharedIncomeCalc />
} 