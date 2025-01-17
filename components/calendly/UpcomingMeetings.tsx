'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getUpcomingMeetings, cancelMeeting } from '@/lib/calendly/calendly-zoom-service';

interface Meeting {
  id: number;
  eventType: string;
  startTime: string;
  endTime: string;
  inviteeName: string;
  inviteeEmail: string;
  status: string;
  zoomSession: {
    id: number;
    topic: string;
    status: string;
  } | null;
}

interface UpcomingMeetingsProps {
  userDbId: number;
  onError?: (error: Error) => void;
}

export default function UpcomingMeetings({ userDbId, onError }: UpcomingMeetingsProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, [userDbId]);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      const data = await getUpcomingMeetings(userDbId);
      setMeetings(data);
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to load meetings');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (meetingId: number) => {
    try {
      await cancelMeeting(meetingId);
      // Optimistically update UI
      setMeetings(prev => 
        prev.map(meeting => 
          meeting.id === meetingId 
            ? { ...meeting, status: 'canceled' }
            : meeting
        )
      );
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to cancel meeting');
      onError?.(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No upcoming meetings scheduled
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map(meeting => (
        <div 
          key={meeting.id}
          className="border rounded-lg p-4 space-y-2"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{meeting.eventType}</h3>
              <p className="text-sm text-gray-500">
                with {meeting.inviteeName}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {meeting.status === 'scheduled' && (
                <button
                  onClick={() => handleCancel(meeting.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Cancel
                </button>
              )}
              {meeting.status === 'canceled' && (
                <span className="text-sm text-red-600">
                  Canceled
                </span>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {format(new Date(meeting.startTime), 'MMM d, yyyy h:mm a')}
          </div>

          {meeting.zoomSession && (
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <div className="text-sm font-medium text-blue-900">
                Zoom Meeting
              </div>
              <div className="text-sm text-blue-700">
                <a 
                  href={`/meeting/${meeting.zoomSession.id}`}
                  className="hover:underline"
                >
                  Join Meeting
                </a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 