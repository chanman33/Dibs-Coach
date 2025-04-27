"use client";

import { useState } from "react";
import { PortfolioForm } from "./PortfolioForm";
import { CreatePortfolioItem, UpdatePortfolioItem } from "@/utils/types/portfolio";
import { useProfileContext } from "./ProfileContext";
import { toast } from "sonner";

export function PortfolioPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { portfolioItems, addPortfolioItem, updatePortfolioItem, deletePortfolioItem } = useProfileContext();

  // Handler for adding a new portfolio item
  const handleAddItem = async (data: CreatePortfolioItem) => {
    setIsSubmitting(true);
    try {
      console.log("[PORTFOLIO_ADD_START]", {
        data: {
          type: data.type,
          title: data.title,
          hasImage: !!data.imageUrls?.length,
          imageUrls: data.imageUrls
        },
        timestamp: new Date().toISOString()
      });
      
      // No need to process image upload since it's already done in the form
      const result = await addPortfolioItem(data);
      
      console.log("[PORTFOLIO_ADD_RESULT]", {
        success: !result.error,
        error: result.error,
        data: result.data ? 'exists' : 'null',
        timestamp: new Date().toISOString()
      });
      
      if (result.error) {
        return { error: result.error };
      }
      
      return { data: result.data };
    } catch (error) {
      console.error("[ADD_PORTFOLIO_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      return { error: error instanceof Error ? error.message : "Failed to add portfolio item" };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for updating a portfolio item
  const handleUpdateItem = async (id: string, data: UpdatePortfolioItem) => {
    setIsSubmitting(true);
    try {
      console.log("[PORTFOLIO_UPDATE_START]", {
        id,
        data: {
          type: data.type,
          title: data.title,
          hasImage: !!data.imageUrls?.length,
          imageUrls: data.imageUrls
        },
        timestamp: new Date().toISOString()
      });
      
      // No need to process image upload since it's already done in the form
      const result = await updatePortfolioItem(id, data);
      
      if (result.error) {
        return { error: result.error };
      }
      
      return { data: result.data };
    } catch (error) {
      console.error("[UPDATE_PORTFOLIO_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      return { error: error instanceof Error ? error.message : "Failed to update portfolio item" };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for deleting a portfolio item
  const handleDeleteItem = async (id: string) => {
    setIsSubmitting(true);
    try {
      const result = await deletePortfolioItem(id);
      if (result.error) {
        return { error: result.error };
      }
      
      return {};
    } catch (error) {
      console.error("[DELETE_PORTFOLIO_ERROR]", error);
      return { error: "Failed to delete portfolio item" };
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortfolioForm
      portfolioItems={portfolioItems}
      onAddItem={handleAddItem}
      onUpdateItem={handleUpdateItem}
      onDeleteItem={handleDeleteItem}
      isSubmitting={isSubmitting}
    />
  );
} 