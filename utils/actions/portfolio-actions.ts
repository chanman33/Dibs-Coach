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

/**
 * Upload an image file to Supabase Storage for portfolio items
 * @param formData FormData object containing the file and userId
 * @returns The public URL of the uploaded image or null if it fails
 */
export async function uploadPortfolioImage(
  formData: FormData
): Promise<ApiResponse<string>> {
  try {
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    
    if (!file || file.size === 0) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "No file provided in FormData"
        }
      };
    }
    
    if (!userId) {
      return {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: "No userId provided in FormData"
        }
      };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        data: null,
        error: {
          code: "INVALID_FILE_TYPE",
          message: "Invalid file type. Please upload a JPG, PNG, WebP, or GIF"
        }
      };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        data: null,
        error: {
          code: "FILE_TOO_LARGE",
          message: "File too large. Maximum size is 5MB"
        }
      };
    }

    const supabase = createAuthClient();
    
    // Generate a unique filename with original extension
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${ulid()}.${fileExt}`;
    
    // Upload to Supabase Storage using service role
    const { data, error } = await supabase
      .storage
      .from('portfolio-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error("[PORTFOLIO_IMAGE_UPLOAD_ERROR]", error);
      return {
        data: null,
        error: {
          code: "UPLOAD_FAILED",
          message: "Failed to upload image"
        }
      };
    }
    
    // Get the public URL - bucket is public so all files are accessible
    const { data: urlData } = await supabase
      .storage
      .from('portfolio-images')
      .getPublicUrl(fileName);
    
    return { data: urlData.publicUrl, error: null };
  } catch (error) {
    console.error("[PORTFOLIO_IMAGE_UPLOAD_ERROR]", error);
    return {
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred while uploading the image"
      }
    };
  }
}

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

    // Detailed logging to debug undefined error
    console.log("[CREATE_PORTFOLIO_ITEM_START]", {
      dataReceived: {
        type: data.type,
        title: data.title,
        hasImageUrls: !!data.imageUrls?.length,
        imageUrlsType: data.imageUrls ? typeof data.imageUrls : null,
        imageUrl: data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls[0] : null,
        description: typeof data.description !== 'undefined' ? 'exists' : 'undefined',
        location: typeof data.location !== 'undefined' ? 'exists' : 'undefined',
        financialDetails: typeof data.financialDetails !== 'undefined' ? 'exists' : 'undefined',
      },
      timestamp: new Date().toISOString()
    });

    const supabase = createAuthClient();
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("ulid")
      .eq("userId", userId)
      .single();

    if (userError || !userData) {
      console.error("[CREATE_PORTFOLIO_USER_ERROR]", {
        error: userError,
        userId,
        timestamp: new Date().toISOString()
      });
      return { 
        data: null, 
        error: { 
          code: "USER_NOT_FOUND", 
          message: "User not found" 
        } 
      };
    }

    const portfolioItemId = ulid();
    
    // Log data transformation
    console.log("[CREATE_PORTFOLIO_TRANSFORM]", {
      userUlid: userData.ulid,
      portfolioItemId,
      imageData: data.imageUrls,
      timestamp: new Date().toISOString()
    });
    
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
      date: new Date(`${data.date}T00:00:00Z`).toISOString(),
      tags: data.tags,
      featured: data.featured,
      isVisible: data.isVisible,
      updatedAt: new Date().toISOString(),
    };
    
    // Log the item being inserted
    console.log("[CREATE_PORTFOLIO_INSERT]", {
      portfolioItemId,
      itemData: {
        type: newItem.type,
        title: newItem.title,
        hasImageUrls: !!newItem.imageUrls?.length,
        imageUrl: newItem.imageUrls && newItem.imageUrls.length > 0 ? newItem.imageUrls[0] : null,
      },
      timestamp: new Date().toISOString()
    });

    // Type-safe query with explicit cast
    const { data: insertedData, error } = await supabase
      .from("PortfolioItem")
      .insert(newItem)
      .select()
      .single();

    if (error) {
      console.error("[CREATE_PORTFOLIO_DB_ERROR]", {
        error,
        item: {
          type: newItem.type,
          title: newItem.title,
          hasImageUrls: !!newItem.imageUrls?.length, 
          imageUrls: newItem.imageUrls
        },
        timestamp: new Date().toISOString()
      });
      return { 
        data: null, 
        error: { 
          code: "DATABASE_ERROR", 
          message: error.message 
        } 
      };
    }

    console.log("[CREATE_PORTFOLIO_SUCCESS]", {
      portfolioItemId,
      timestamp: new Date().toISOString()
    });
    
    revalidatePath("/profile");

    return { data: insertedData as unknown as PortfolioItem, error: null };
  } catch (error) {
    console.error("[CREATE_PORTFOLIO_ITEM_ERROR]", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
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
    // Create a base payload excluding the potentially incompatible date field
    const updatePayload: Partial<PortfolioItemRow> = {
      ...data, // Spread incoming data first
      date: undefined, // Explicitly override date from the spread
      updatedAt: new Date().toISOString(), // Always include updated timestamp
    };
    
    // Remove the original date field from the spread object just in case
    delete updatePayload.date; 

    // Convert and add the date field back if it exists in the original 'data'
    if (data.date) {
      // Handle both string (YYYY-MM-DD) and Date object inputs
      const dateValue = typeof data.date === 'string' 
        ? data.date 
        : data.date instanceof Date 
          ? data.date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
          : String(data.date); // Fallback (should ideally not happen with Zod validation)

      // Ensure we have a valid date string before converting
      if (dateValue && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
         // Convert YYYY-MM-DD string to full ISO string for Supabase
        updatePayload.date = new Date(`${dateValue}T00:00:00Z`).toISOString();
      } else {
        // Log a warning if the date format is unexpected after processing
        console.warn("[UPDATE_PORTFOLIO_WARN] Unexpected date format received:", data.date);
      }
    }

    // Type-safe query using the explicitly typed payload
    const { data: updatedData, error } = await supabase
      .from("PortfolioItem")
      .update(updatePayload) // Use the refined payload
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