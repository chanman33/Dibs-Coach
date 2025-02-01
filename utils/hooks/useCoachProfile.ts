"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CoachProfile, CoachProfileSchema, UpdateCoachProfileSchema, CoachMetrics } from "../types/coach";

interface UseCoachProfileReturn {
  profile: CoachProfile | null;
  metrics: CoachMetrics | null;
  isLoading: boolean;
  error: Error | null;
  fetchProfile: () => Promise<void>;
  fetchMetrics: () => Promise<void>;
  createProfile: (data: Omit<CoachProfile, "id" | "totalSessions" | "averageRating">) => Promise<CoachProfile | null>;
  updateProfile: (data: Partial<Omit<CoachProfile, "id" | "totalSessions" | "averageRating">>) => Promise<CoachProfile | null>;
}

export function useCoachProfile(): UseCoachProfileReturn {
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [metrics, setMetrics] = useState<CoachMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/coach/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const { data } = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to fetch coach profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/coach/metrics");
      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }
      const { data } = await response.json();
      setMetrics(data);
      
      // Update profile with new metrics if it exists
      if (profile && data) {
        setProfile({
          ...profile,
          totalSessions: data.totalSessions,
          averageRating: data.averageRating,
        });
      }
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to fetch coach metrics");
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (data: Omit<CoachProfile, "id" | "totalSessions" | "averageRating">) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate data
      CoachProfileSchema.parse(data);

      const response = await fetch("/api/coach/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create profile");
      }

      const { data: newProfile } = await response.json();
      setProfile(newProfile);
      toast.success("Coach profile created successfully");
      return newProfile;
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to create coach profile");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Omit<CoachProfile, "id" | "totalSessions" | "averageRating">>) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate data
      UpdateCoachProfileSchema.parse({ ...profile, ...data });

      const response = await fetch("/api/coach/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const { data: updatedProfile } = await response.json();
      setProfile(updatedProfile);
      toast.success("Coach profile updated successfully");
      return updatedProfile;
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to update coach profile");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    metrics,
    isLoading,
    error,
    fetchProfile,
    fetchMetrics,
    createProfile,
    updateProfile,
  };
} 