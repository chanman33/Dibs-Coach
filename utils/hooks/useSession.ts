"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Session,
  SessionCreate,
  SessionUpdate,
  SessionMetrics,
} from "../types/session";

interface UseSessionReturn {
  sessions: Session[];
  metrics: SessionMetrics | null;
  isLoading: boolean;
  error: Error | null;
  fetchSessions: () => Promise<void>;
  createSession: (data: SessionCreate) => Promise<Session | null>;
  updateSession: (data: SessionUpdate) => Promise<Session | null>;
  calculateMetrics: (sessions: Session[]) => SessionMetrics;
}

export function useSession(): UseSessionReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateMetrics = (sessions: Session[]): SessionMetrics => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.status === "completed"
    ).length;
    const cancelledSessions = sessions.filter(
      (s) => s.status === "cancelled"
    ).length;
    const noShows = sessions.filter((s) => s.status === "no_show").length;

    const totalMinutes = sessions.reduce(
      (acc, curr) => acc + curr.durationMinutes,
      0
    );
    const totalHours = totalMinutes / 60;
    const averageDuration =
      totalSessions > 0 ? totalMinutes / totalSessions : 0;
    const completionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      noShows,
      totalHours,
      averageDuration,
      completionRate,
    };
  };

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/session");
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const { data } = await response.json();

      // Add durationMinutes to each session
      const sessionsWithDuration = data.map((session: Session) => ({
        ...session,
        durationMinutes: Math.round(
          (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
        ),
      }));

      setSessions(sessionsWithDuration);

      // Calculate and set metrics
      const newMetrics = calculateMetrics(sessionsWithDuration);
      setMetrics(newMetrics);
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (data: SessionCreate) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const { data: newSession } = await response.json();
      setSessions((prev) => [newSession, ...prev]);

      // Update metrics
      const newMetrics = calculateMetrics([...sessions, newSession]);
      setMetrics(newMetrics);

      toast.success("Session created successfully");
      return newSession;
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to create session");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSession = async (data: SessionUpdate) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/session", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update session");
      }

      const { data: updatedSession } = await response.json();
      setSessions((prev) =>
        prev.map((session) =>
          session.id === data.id ? updatedSession : session
        )
      );

      // Update metrics
      const newMetrics = calculateMetrics(
        sessions.map((session) =>
          session.id === data.id ? updatedSession : session
        )
      );
      setMetrics(newMetrics);

      toast.success("Session updated successfully");
      return updatedSession;
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to update session");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sessions,
    metrics,
    isLoading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    calculateMetrics,
  };
} 