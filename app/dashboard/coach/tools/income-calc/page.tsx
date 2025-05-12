import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import SharedIncomeCalc from "@/components/tools/income-calc/page"

export const dynamic = 'force-dynamic';

export default async function CoachIncomeCalc() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return <SharedIncomeCalc />
} 