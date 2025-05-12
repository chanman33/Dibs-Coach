"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  TransformedSession, 
  SessionsAnalytics,
  defaultAnalytics
} from "../types/session";
import { ApiResponse } from "../types/api";

interface UseSessionReturn {
  sessions: TransformedSession[];
  metrics: SessionsAnalytics;
  isLoading: boolean;
  error: Error | null;
  fetchSessions: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [sessions, setSessions] = useState<TransformedSession[]>([]);
  const [metrics, setMetrics] = useState<SessionsAnalytics>(defaultAnalytics);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateMetrics = (sessions: TransformedSession[]): SessionsAnalytics => {
    const total = sessions.length;
    const scheduled = sessions.filter(s => s.status === 'SCHEDULED').length;
    const completed = sessions.filter(s => s.status === 'COMPLETED').length;
    const cancelled = sessions.filter(s => s.status === 'CANCELLED').length;
    const no_show = sessions.filter(s => s.status === 'NO_SHOW').length;

    return {
      total,
      scheduled,
      completed,
      cancelled,
      no_show
    };
  };

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the server action to fetch sessions
      const response = await fetch('/api/sessions');
      
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      
      const result = await response.json() as ApiResponse<TransformedSession[]>;

      if (result.error) {
        throw new Error(result.error.message || "Failed to fetch sessions");
      }

      // Use the data if it exists
      if (result.data) {
        setSessions(result.data);
        
        // Calculate and set metrics
        const newMetrics = calculateMetrics(result.data);
        setMetrics(newMetrics);
      }
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sessions,
    metrics,
    isLoading,
    error,
    fetchSessions
  };
} 