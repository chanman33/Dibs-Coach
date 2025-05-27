'use server'

import { z } from 'zod'
import { auth } from '@clerk/nextjs'
import { createServerAuthClient } from '@/utils/auth'
import { rescheduleSession } from '@/utils/actions/cal/rescheduleActions' // Existing action

const respondToProposalSchema = z.object({
  sessionUlid: z.string().min(1, "Session ULID is required"),
  accepted: z.boolean(),
  menteeResponseReason: z.string().optional(),
});

type RespondToProposalInput = z.infer<typeof respondToProposalSchema>;

export async function respondToCoachRescheduleProposalAction(input: RespondToProposalInput) {
  try {
    const validatedInput = respondToProposalSchema.parse(input);
    const { sessionUlid, accepted, menteeResponseReason } = validatedInput;

    const { userId } = auth();
    if (!userId) {
      return { data: null, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } };
    }

    const supabase = createServerAuthClient();

    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid')
      .eq('userId', userId)
      .single();

    if (userError || !userData) {
      console.error('[MENTEE_RESPOND_PROPOSAL_ERROR] Failed to get user data:', userError);
      return { data: null, error: { code: 'USER_NOT_FOUND', message: 'Could not find user data' } };
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('Session')
      .select('menteeUlid, status, proposedStartTime, proposedEndTime, calBookingUlid, coachUlid, reschedulingHistory, originalSessionUlid')
      .eq('ulid', sessionUlid)
      .single();

    if (sessionError || !sessionData) {
      console.error('[MENTEE_RESPOND_PROPOSAL_ERROR] Failed to get session data:', sessionError);
      return { data: null, error: { code: 'SESSION_NOT_FOUND', message: 'Could not find session data' } };
    }

    if (sessionData.menteeUlid !== userData.ulid) {
      return { data: null, error: { code: 'UNAUTHORIZED', message: 'User is not the mentee for this session' } };
    }

    if (sessionData.status !== 'COACH_PROPOSED_RESCHEDULE') {
      return {
        data: null,
        error: {
          code: 'INVALID_STATUS',
          message: `Session is not awaiting mentee response. Current status: ${sessionData.status}`,
        },
      };
    }

    if (accepted) {
      if (!sessionData.proposedStartTime || !sessionData.proposedEndTime || !sessionData.calBookingUlid) {
        console.error('[MENTEE_RESPOND_PROPOSAL_ERROR] Missing proposed times or calBookingUlid for acceptance.');
        return {
          data: null,
          error: { code: 'MISSING_DATA', message: 'Cannot accept proposal due to missing session details.' },
        };
      }

      // Call the existing rescheduleSession action
      // This action handles Cal.com API interaction and DB updates (new session, old session status)
      const rescheduleResult = await rescheduleSession({
        sessionUlid: sessionUlid, // The current sessionUlid which will be marked as RESCHEDULED
        calBookingUid: sessionData.calBookingUlid, // This is the ULID of our CalBooking table entry
        newStartTime: sessionData.proposedStartTime,
        newEndTime: sessionData.proposedEndTime,
        reschedulingReason: menteeResponseReason || 'Mentee accepted coach proposal',
      });

      if (rescheduleResult.error) {
        console.error('[MENTEE_RESPOND_PROPOSAL_ERROR] rescheduleSession action failed:', rescheduleResult.error);
        // Optionally, revert the status if rescheduleSession fails critically
        // For now, we'll let the error propagate to the client.
        return { 
            data: null, 
            error: { 
                code: 'RESCHEDULE_FAILED', 
                message: `Failed to finalize reschedule: ${rescheduleResult.error.message}`,
                details: rescheduleResult.error.details
            }
        };
      }
      
      // The rescheduleSession action now creates a new session and updates the old one.
      // No further updates needed here for the accepted case regarding session status or proposed times.
      return { data: { success: true, newSessionDetails: rescheduleResult.data }, error: null };

    } else {
      // Mentee rejected the proposal
      const { error: updateError } = await supabase
        .from('Session')
        .update({
          status: 'SCHEDULED', // Revert to original scheduled status, or introduce MENTEE_REJECTED_RESCHEDULE
          proposedStartTime: null,
          proposedEndTime: null,
          rescheduleProposalReason: null,
          rescheduleProposedByUlid: null,
          // Optionally log rejection reason or update history
          updatedAt: new Date().toISOString(),
        })
        .eq('ulid', sessionUlid);

      if (updateError) {
        console.error('[MENTEE_RESPOND_PROPOSAL_ERROR] Failed to update session on rejection:', updateError);
        return { data: null, error: { code: 'DB_ERROR', message: 'Failed to update session after rejection' } };
      }
      
      // TODO: Implement notification to coach about rejection
      return { data: { success: true, status: 'rejected' }, error: null };
    }

  } catch (error) {
    console.error('[MENTEE_RESPOND_PROPOSAL_ERROR] Top-level error:', error);
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