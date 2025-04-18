"use server";

import { ulid } from "ulid";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs";
import { createAuthClient } from "@/utils/supabase/server";
import {
  PortfolioItem,
  CreatePortfolioItem,
  UpdatePortfolioItem,
} from "@/utils/types/portfolio";
import type { ApiResponse } from "@/utils/types/api";
import { PortfolioItemRow, PortfolioItemInsert } from "@/utils/supabase/types";

// Fetch portfolio items for the current user
export async function fetchPortfolioItems(): Promise<ApiResponse<PortfolioItem[]>> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { 
        data: null, 
        error: { 
          code: "UNAUTHORIZED", 
          message: "Not authenticated" 
        } 
      };
    }

    const supabase = createAuthClient();
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("ulid")
      .eq("userId", userId)
      .single();

    if (userError || !userData) {
      return { 
        data: null, 
        error: { 
          code: "USER_NOT_FOUND", 
          message: "User not found" 
        } 
      };
    }

    // Type-safe query with explicit cast
    const { data, error } = await supabase
      .from("PortfolioItem")
      .select("*")
      .eq("userUlid", userData.ulid)
      .order("featured", { ascending: false })
      .order("date", { ascending: false });

    if (error) {
      return { 
        data: null, 
        error: { 
          code: "DATABASE_ERROR", 
          message: error.message 
        } 
      };
    }

    return { data: data as unknown as PortfolioItem[], error: null };
  } catch (error) {
    console.error("[FETCH_PORTFOLIO_ITEMS_ERROR]", error);
    return { 
      data: null, 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to fetch portfolio items" 
      } 
    };
  }
}

// Fetch portfolio items for a specific coach (for public profile view)
export async function fetchCoachPortfolioItems(coachUserUlid: string): Promise<ApiResponse<PortfolioItem[]>> {
  try {
    if (!coachUserUlid) {
      return { 
        data: null, 
        error: { 
          code: "INVALID_INPUT", 
          message: "Coach user ID is required" 
        } 
      };
    }

    const supabase = createAuthClient();
    
    // Type-safe query with explicit cast
    const { data, error } = await supabase
      .from("PortfolioItem")
      .select("*")
      .eq("userUlid", coachUserUlid)
      .eq("isVisible", true) // Only show visible items on public profile
      .order("featured", { ascending: false })
      .order("date", { ascending: false });

    if (error) {
      return { 
        data: null, 
        error: { 
          code: "DATABASE_ERROR", 
          message: error.message 
        } 
      };
    }

    return { data: data as unknown as PortfolioItem[], error: null };
  } catch (error) {
    console.error("[FETCH_COACH_PORTFOLIO_ITEMS_ERROR]", error);
    return { 
      data: null, 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to fetch coach portfolio items" 
      } 
    };
  }
}

// Create a new portfolio item
export async function createPortfolioItem(
  data: CreatePortfolioItem
): Promise<ApiResponse<PortfolioItem>> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { 
        data: null, 
        error: { 
          code: "UNAUTHORIZED", 
          message: "Not authenticated" 
        } 
      };
    }

    const supabase = createAuthClient();
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("ulid")
      .eq("userId", userId)
      .single();

    if (userError || !userData) {
      return { 
        data: null, 
        error: { 
          code: "USER_NOT_FOUND", 
          message: "User not found" 
        } 
      };
    }

    const portfolioItemId = ulid();
    const newItem: PortfolioItemInsert = {
      ulid: portfolioItemId,
      userUlid: userData.ulid,
      type: data.type,
      title: data.title,
      description: data.description || null,
      address: data.address || null,
      imageUrls: data.imageUrls || null,
      metrics: data.metrics || null,
      financialDetails: data.financialDetails || null,
      location: data.location || null,
      date: new Date(data.date).toISOString(),
      tags: data.tags,
      featured: data.featured,
      isVisible: data.isVisible,
      updatedAt: new Date().toISOString(),
    };

    // Type-safe query with explicit cast
    const { data: insertedData, error } = await supabase
      .from("PortfolioItem")
      .insert(newItem as any)
      .select()
      .single();

    if (error) {
      return { 
        data: null, 
        error: { 
          code: "DATABASE_ERROR", 
          message: error.message 
        } 
      };
    }

    revalidatePath("/profile");

    return { data: insertedData as unknown as PortfolioItem, error: null };
  } catch (error) {
    console.error("[CREATE_PORTFOLIO_ITEM_ERROR]", error);
    return { 
      data: null, 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to create portfolio item" 
      } 
    };
  }
}

// Update a portfolio item
export async function updatePortfolioItem(
  itemUlid: string,
  data: UpdatePortfolioItem
): Promise<ApiResponse<PortfolioItem>> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { 
        data: null, 
        error: { 
          code: "UNAUTHORIZED", 
          message: "Not authenticated" 
        } 
      };
    }

    const supabase = createAuthClient();
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("ulid")
      .eq("userId", userId)
      .single();

    if (userError || !userData) {
      return { 
        data: null, 
        error: { 
          code: "USER_NOT_FOUND", 
          message: "User not found" 
        } 
      };
    }

    // Check if the item belongs to the user
    const { data: existingItem, error: checkError } = await supabase
      .from("PortfolioItem")
      .select("*")
      .eq("ulid", itemUlid)
      .eq("userUlid", userData.ulid)
      .single();

    if (checkError || !existingItem) {
      return { 
        data: null, 
        error: { 
          code: "ITEM_NOT_FOUND", 
          message: "Portfolio item not found or doesn't belong to the user" 
        } 
      };
    }

    // Process data for update with typesafety
    const updateData = { 
      ...data,
      // Always include updated timestamp
      updatedAt: new Date().toISOString(),
      // Convert date if present
      ...(data.date ? { date: new Date(data.date).toISOString() } : {})
    };

    // Type-safe query with explicit cast
    const { data: updatedData, error } = await supabase
      .from("PortfolioItem")
      .update(updateData as any)
      .eq("ulid", itemUlid)
      .select()
      .single();

    if (error) {
      return { 
        data: null, 
        error: { 
          code: "DATABASE_ERROR", 
          message: error.message 
        } 
      };
    }

    revalidatePath("/profile");

    return { data: updatedData as unknown as PortfolioItem, error: null };
  } catch (error) {
    console.error("[UPDATE_PORTFOLIO_ITEM_ERROR]", error);
    return { 
      data: null, 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to update portfolio item" 
      } 
    };
  }
}

// Delete a portfolio item
export async function deletePortfolioItem(
  itemUlid: string
): Promise<ApiResponse<null>> {
  try {
    const { userId } = auth();
    if (!userId) {
      return { 
        data: null, 
        error: { 
          code: "UNAUTHORIZED", 
          message: "Not authenticated" 
        } 
      };
    }

    const supabase = createAuthClient();
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("ulid")
      .eq("userId", userId)
      .single();

    if (userError || !userData) {
      return { 
        data: null, 
        error: { 
          code: "USER_NOT_FOUND", 
          message: "User not found" 
        } 
      };
    }

    // Check if the item belongs to the user
    const { data: existingItem, error: checkError } = await supabase
      .from("PortfolioItem")
      .select("ulid")
      .eq("ulid", itemUlid)
      .eq("userUlid", userData.ulid)
      .single();

    if (checkError || !existingItem) {
      return { 
        data: null, 
        error: { 
          code: "ITEM_NOT_FOUND", 
          message: "Portfolio item not found or doesn't belong to the user" 
        } 
      };
    }

    const { error } = await supabase
      .from("PortfolioItem")
      .delete()
      .eq("ulid", itemUlid);

    if (error) {
      return { 
        data: null, 
        error: { 
          code: "DATABASE_ERROR", 
          message: error.message 
        } 
      };
    }

    revalidatePath("/profile");

    return { data: null, error: null };
  } catch (error) {
    console.error("[DELETE_PORTFOLIO_ITEM_ERROR]", error);
    return { 
      data: null, 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to delete portfolio item" 
      } 
    };
  }
} 