"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CoachingSchedule } from "../types/coaching";

interface UseCoachingAvailabilityReturn {
  schedules: CoachingSchedule[];
  isLoading: boolean;
  error: Error | null;
  fetchSchedules: () => Promise<void>;
  createSchedule: (data: Omit<CoachingSchedule, "id">) => Promise<CoachingSchedule | null>;
  updateSchedule: (id: number, data: Omit<CoachingSchedule, "id">) => Promise<CoachingSchedule | null>;
  deleteSchedule: (id: number) => Promise<boolean>;
}

export function useCoachingAvailability(): UseCoachingAvailabilityReturn {
  const [schedules, setSchedules] = useState<CoachingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/coaching/availability");
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      const { data } = await response.json();
      setSchedules(data);
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to fetch availability schedules");
    } finally {
      setIsLoading(false);
    }
  };

  const createSchedule = async (data: Omit<CoachingSchedule, "id">) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/coaching/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create schedule");
      }

      const { data: newSchedule } = await response.json();
      setSchedules((prev) => [...prev, newSchedule]);
      toast.success("Schedule created successfully");
      return newSchedule;
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to create schedule");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSchedule = async (id: number, data: Omit<CoachingSchedule, "id">) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/coaching/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        throw new Error("Failed to update schedule");
      }

      const { data: updatedSchedule } = await response.json();
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === id ? updatedSchedule : schedule
        )
      );
      toast.success("Schedule updated successfully");
      return updatedSchedule;
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to update schedule");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSchedule = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/coaching/availability?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete schedule");
      }

      setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
      toast.success("Schedule deleted successfully");
      return true;
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to delete schedule");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    schedules,
    isLoading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
} 