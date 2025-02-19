"use server";

import { createAuthClient } from "@/utils/auth";
import { auth } from "@clerk/nextjs/server";
import { InvalidClerkUserIdError, UserNotFoundError } from "@/utils/types/auth";
import config from "@/config";
import { getSubscriptionDetails } from "@/utils/actions/subscription-actions";

export const isAuthorized = async (): Promise<{ authorized: boolean; message: string }> => {
  try {
    // If payments are disabled, always return authorized
    if (!config?.payments?.enabled) {
      return {
        authorized: true,
        message: "Payments are disabled",
      };
    }

    // Get authenticated user
    const session = await auth();
    if (!session?.userId) {
      throw new InvalidClerkUserIdError("No user ID in session");
    }

    // Get supabase client
    const supabase = await createAuthClient();

    // Get user's ULID
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("ulid")
      .eq("userId", session.userId)
      .single();

    if (userError || !userData) {
      console.error("[AUTH_ERROR] User not found:", { userId: session.userId, error: userError });
      throw new UserNotFoundError({ clerkUserId: session.userId });
    }

    // Get subscription details (will create free tier if none exists)
    const { data: subscriptionData, error: subscriptionError } = await getSubscriptionDetails({ userUlid: userData.ulid });

    if (subscriptionError) {
      console.error("[SUBSCRIPTION_ERROR]", { 
        userUlid: userData.ulid, 
        error: subscriptionError 
      });
      // Even if there's an error, we'll authorize the user since they should have access to free tier
      return {
        authorized: true,
        message: "Defaulting to free tier access",
      };
    }

    if (!subscriptionData) {
      // If no subscription data but also no error, we'll still authorize for free tier
      return {
        authorized: true,
        message: "Free tier access granted",
      };
    }

    const { subscription, plan } = subscriptionData;

    // Free plan is always authorized
    if (plan.planId === 'price_free') {
      return {
        authorized: true,
        message: "Free tier active",
      };
    }

    // For paid plans, check subscription status
    return {
      authorized: subscription.status === "active",
      message: subscription.status === "active" 
        ? `Active ${plan.name} subscription`
        : `Subscription status: ${subscription.status}`,
    };

  } catch (error) {
    console.error("[AUTHORIZATION_ERROR]", error);
    // In case of errors, default to providing free tier access
    return {
      authorized: true,
      message: error instanceof Error 
        ? `Error checking subscription, defaulting to free tier: ${error.message}`
        : "Error checking subscription, defaulting to free tier",
    };
  }
};
