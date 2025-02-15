"use server";

import { createAuthClient } from "@/utils/auth";
import { auth } from "@clerk/nextjs/server";
import { InvalidClerkUserIdError, UserNotFoundError } from "@/utils/types/auth";
import config from "@/config";

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

    // Check subscription status using ULID
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("Subscription")
      .select("status")
      .eq("userUlid", userData.ulid)
      .single();

    if (subscriptionError) {
      console.error("[SUBSCRIPTION_ERROR]", { 
        userUlid: userData.ulid, 
        error: subscriptionError 
      });
      return {
        authorized: false,
        message: "Error checking subscription status",
      };
    }

    if (!subscriptionData) {
      return {
        authorized: false,
        message: "No active subscription found",
      };
    }

    return {
      authorized: subscriptionData.status === "active",
      message: subscriptionData.status === "active" 
        ? "User has active subscription"
        : "Subscription is not active",
    };

  } catch (error) {
    console.error("[AUTHORIZATION_ERROR]", error);
    return {
      authorized: false,
      message: error instanceof Error ? error.message : "Authorization check failed",
    };
  }
};
