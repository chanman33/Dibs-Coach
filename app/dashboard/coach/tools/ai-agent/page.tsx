import { auth } from "@clerk/nextjs/server";
import AIAgent from "@/components/ai-agent/AI-Agent";
import { createUserIfNotExists } from "@/utils/auth";
import { redirect } from "next/navigation";
import { USER_CAPABILITIES } from "@/utils/roles/roles";
import { createAuthClient } from "@/utils/auth";

export default async function CoachAIAgentPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Create user if not exists
  const userContext = await createUserIfNotExists(userId);
  
  // Get full user data from database
  const supabase = createAuthClient();
  const { data: user, error } = await supabase
    .from('User')
    .select('*')
    .eq('userId', userId)
    .single();
    
  if (error || !user) {
    console.error('[AI_AGENT_PAGE] Error fetching user:', {
      userId,
      error: error?.message || 'User not found',
      timestamp: new Date().toISOString()
    });
    redirect("/dashboard");
  }
  
  if (!user?.capabilities?.includes(USER_CAPABILITIES.COACH)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-8 text-3xl font-bold">Real Estate GPT</h1>
      <AIAgent 
        userId={userId} 
        userUlid={user.ulid}
        threadCategory="GENERAL"
      />
    </div>
  );
}
