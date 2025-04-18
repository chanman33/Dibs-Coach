"use client";

import { useState } from "react";
import { PortfolioForm } from "./PortfolioForm";
import { CreatePortfolioItem, UpdatePortfolioItem } from "@/utils/types/portfolio";
import { useProfileContext } from "../context/ProfileContext";
import { toast } from "sonner";

export function PortfolioPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { portfolioItems, addPortfolioItem, updatePortfolioItem, deletePortfolioItem } = useProfileContext();

  // Handler for adding a new portfolio item
  const handleAddItem = async (data: CreatePortfolioItem) => {
    setIsSubmitting(true);
    try {
      const result = await addPortfolioItem(data);
      if (result.error) {
        return { error: result.error };
      }
      
      return { data: result.data };
    } catch (error) {
      console.error("[ADD_PORTFOLIO_ERROR]", error);
      return { error: "Failed to add portfolio item" };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for updating a portfolio item
  const handleUpdateItem = async (id: string, data: UpdatePortfolioItem) => {
    setIsSubmitting(true);
    try {
      const result = await updatePortfolioItem(id, data);
      if (result.error) {
        return { error: result.error };
      }
      
      return { data: result.data };
    } catch (error) {
      console.error("[UPDATE_PORTFOLIO_ERROR]", error);
      return { error: "Failed to update portfolio item" };
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