'use server'

import { z } from 'zod'
import { auth } from '@clerk/nextjs'
import { createServerAuthClient } from '@/utils/auth'

const proposeRescheduleSchema = z.object({
  sessionUlid: z.string().min(1, "Session ULID is required"),
  newProposedStartTime: z.string().datetime("Invalid start time format"),
  newProposedEndTime: z.string().datetime("Invalid end time format"),
  proposalReason: z.string().optional(),
});

type ProposeRescheduleInput = z.infer<typeof proposeRescheduleSchema>;

export async function proposeRescheduleByCoachAction(input: ProposeRescheduleInput) {
  try {
    const validatedInput = proposeRescheduleSchema.parse(input);
    const { sessionUlid, newProposedStartTime, newProposedEndTime, proposalReason } = validatedInput;

    const { userId } = auth();
    if (!userId) {
      return { data: null, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } };
    }

    const supabase = createServerAuthClient();

    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid, email')
      .eq('userId', userId)
      .single();

    if (userError || !userData) {
      console.error('[COACH_PROPOSE_RESCHEDULE_ERROR] Failed to get user data:', userError);
      return { data: null, error: { code: 'USER_NOT_FOUND', message: 'Could not find user data' } };
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('Session')
      .select('coachUlid, status')
      .eq('ulid', sessionUlid)
      .single();

    if (sessionError || !sessionData) {
      console.error('[COACH_PROPOSE_RESCHEDULE_ERROR] Failed to get session data:', sessionError);
      return { data: null, error: { code: 'SESSION_NOT_FOUND', message: 'Could not find session data' } };
    }

    if (sessionData.coachUlid !== userData.ulid) {
      return { data: null, error: { code: 'UNAUTHORIZED', message: 'User is not the coach for this session' } };
    }

    if (sessionData.status !== 'SCHEDULED' && sessionData.status !== 'RESCHEDULED') {
      return {
        data: null,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot propose reschedule for a session with status: ${sessionData.status}`,
        },
      };
    }
    
    // Check if proposed start time is in the past
    if (new Date(newProposedStartTime) < new Date()) {
        return {
            data: null,
            error: {
                code: 'INVALID_INPUT',
                message: 'Proposed start time cannot be in the past.'
            }
        };
    }

    // Check if proposed end time is before proposed start time
    if (new Date(newProposedEndTime) <= new Date(newProposedStartTime)) {
        return {
            data: null,
            error: {
                code: 'INVALID_INPUT',
                message: 'Proposed end time must be after the proposed start time.'
            }
        };
    }

    const { error: updateError } = await supabase
      .from('Session')
      .update({
        status: 'COACH_PROPOSED_RESCHEDULE',
        proposedStartTime: newProposedStartTime,
        proposedEndTime: newProposedEndTime,
        rescheduleProposalReason: proposalReason,
        rescheduleProposedByUlid: userData.ulid,
        updatedAt: new Date().toISOString(),
      })
      .eq('ulid', sessionUlid);

    if (updateError) {
      console.error('[COACH_PROPOSE_RESCHEDULE_ERROR] Failed to update session:', updateError);
      return { data: null, error: { code: 'DB_ERROR', message: 'Failed to update session with proposal' } };
    }

    // TODO: Implement notification to mentee

    return { data: { success: true, sessionUlid }, error: null };

  } catch (error) {
    console.error('[COACH_PROPOSE_RESCHEDULE_ERROR] Top-level error:', error);
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: error.flatten(),
        },
      };
    }
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
    };
  }
} 