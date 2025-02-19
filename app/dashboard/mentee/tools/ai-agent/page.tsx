import { auth } from "@clerk/nextjs/server";
import AIAgent from "@/components/ai-agent/AI-Agent";
import { ensureUserExists } from "@/utils/auth";
import { redirect } from "next/navigation";
import { USER_CAPABILITIES } from "@/utils/roles/roles";
import React from "react";

export default async function MenteeAIAgentPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await ensureUserExists();
  
  if (!user?.capabilities?.includes(USER_CAPABILITIES.MENTEE)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Real Estate GPT</h1>
      <AIAgent 
        userId={userId} 
        userUlid={user.ulid}
        threadCategory="GENERAL"
      />
    </div>
  );
}
