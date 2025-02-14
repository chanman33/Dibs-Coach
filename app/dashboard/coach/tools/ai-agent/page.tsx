import { auth } from "@clerk/nextjs/server";
import AIAgent from "@/components/ai-agent/AI-Agent";
import { getUserDbIdAndRole } from "@/utils/auth";
import { redirect } from "next/navigation";

export default async function CoachAIAgentPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const { userDbId, role } = await getUserDbIdAndRole(userId);
  
  if (role !== "COACH") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">RealtorGPT Assistant</h1>
      <AIAgent 
        userId={userId} 
        userDbId={userDbId}
        threadCategory="GENERAL"
      />
    </div>
  );
}
