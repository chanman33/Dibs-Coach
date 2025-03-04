import AIAgent from "@/components/ai-agent/AI-Agent";
import { getAuthContext } from "@/utils/auth/auth-context";
import { hasPermission } from "@/utils/roles/checkUserRole";
import { USER_CAPABILITIES } from "@/utils/roles/roles";
import { redirect } from "next/navigation";
import React from "react";

export default async function MenteeAIAgentPage() {
  // Get auth context which includes user info, role and capabilities
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect("/sign-in");
  }

  // Verify user has MENTEE capability
  if (!hasPermission(authContext, USER_CAPABILITIES.MENTEE)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Real Estate GPT</h1>
      <AIAgent 
        userId={authContext.userId}
        userUlid={authContext.userUlid}
        threadCategory="GENERAL"
      />
    </div>
  );
}
