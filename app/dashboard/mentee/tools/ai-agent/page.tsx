import { auth } from "@clerk/nextjs/server";
import AIAgent from "@/components/ai-agent/AI-Agent";
import { getUserDbIdAndRole } from "@/utils/auth";
import { redirect } from "next/navigation";

export default async function MenteeAIAgentPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const { userDbId, role } = await getUserDbIdAndRole(userId);
  
  if (role !== "MENTEE") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Real EstateGPT</h1>
      <AIAgent 
        userId={userId} 
        userDbId={userDbId}
        threadCategory="GENERAL"
      />
    </div>
  );
}
