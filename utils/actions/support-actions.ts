'use server'

import { z } from 'zod'
import { createAuthClient } from '@/utils/auth'
import { withServerAction, ServerActionContext } from '@/utils/middleware/withServerAction'
import { ApiErrorCode, ApiResponse } from '@/utils/types/api'
import { Prisma } from '@prisma/client' // For direct Prisma type usage if needed
import { ulid } from 'ulid'

const reportIssueSchema = z.object({
  sessionId: z.string().length(26), // ULID length
  issueType: z.string().min(1, { message: 'Issue type is required' }),
  description: z.string().min(1, { message: 'Description is required' }).max(2000, { message: 'Description must be 2000 characters or less' }),
})

export type ReportIssueParams = z.infer<typeof reportIssueSchema>

// Define the expected success data type for the response
interface ReportIssueSuccessData {
  supportTicketId: string;
  message: string;
}

// Adjusted success data type for HOF compatibility test - making params non-optional
type ActionResponseData = ReportIssueSuccessData & ReportIssueParams; 

async function reportSessionIssueActionInternal(
  params: ReportIssueParams,
  context: ServerActionContext
): Promise<ApiResponse<ActionResponseData>> {
  const { userUlid } = context
  if (!userUlid) {
    return { data: null, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }
  }

  const validation = reportIssueSchema.safeParse(params)
  if (!validation.success) {
    console.error('[REPORT_ISSUE_VALIDATION_ERROR]', validation.error.flatten());
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input.',
        details: validation.error.flatten(),
      },
    }
  }

  const { sessionId, issueType, description } = validation.data
  const supportTicketUlid = ulid();
  const currentTime = new Date().toISOString();

  try {
    const supabase = await createAuthClient()
    
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('ulid, coachUlid, menteeUlid, status, startTime')
      .eq('ulid', sessionId)
      .or(`menteeUlid.eq.${userUlid},coachUlid.eq.${userUlid}`)
      .single()

    if (sessionError || !session) {
      console.error('[REPORT_ISSUE_SESSION_FETCH_ERROR]', { sessionId, userUlid, error: sessionError });
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Session not found or you are not authorized to report issues for it.' },
      }
    }

    const now = new Date().getTime();
    const sessionStartTime = new Date(session.startTime).getTime();
    const effectiveStatus = session.status === 'SCHEDULED' && sessionStartTime < now ? 'COMPLETED' : session.status;
    
    if (effectiveStatus !== 'COMPLETED') {
        return {
            data: null,
            error: { code: 'INVALID_OPERATION', message: 'Support requests can only be made for completed sessions.'}
        }
    }

    const { error: ticketError } = await supabase
      .from('SupportTicket')
      .insert({
        ulid: supportTicketUlid,
        userUlid: userUlid, 
        sessionUlid: sessionId,
        title: `Issue Reported for Session: ${sessionId.substring(0, 8)}... - Type: ${issueType}`,
        description: description,
        status: 'OPEN',
        createdAt: currentTime, // Added createdAt
        updatedAt: currentTime, // Added updatedAt
      });

    if (ticketError) {
      console.error('[REPORT_ISSUE_TICKET_CREATE_ERROR]', { error: ticketError });
      return {
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Failed to create support ticket. ' + ticketError.message },
      }
    }

    if (issueType === 'coach_absent' && session.coachUlid) {
      await supabase.from('Session').update({ absentCoach: true, absentCoachMarkedBy: userUlid, absentCoachMarkedAt: currentTime, updatedAt: currentTime }).eq('ulid', sessionId);
    } else if (issueType === 'mentee_absent' && session.menteeUlid) {
      await supabase.from('Session').update({ absentMentee: true, absentMenteeMarkedBy: userUlid, absentMenteeMarkedAt: currentTime, updatedAt: currentTime }).eq('ulid', sessionId);
    }

    return {
      data: { 
        supportTicketId: supportTicketUlid,
        message: 'Support ticket created successfully.',
        // Ensure params are part of the returned data for HOF
        sessionId: sessionId, 
        issueType: issueType,
        description: description,
      },
      error: null,
    }
  } catch (error: any) {
    console.error('[REPORT_ISSUE_UNEXPECTED_ERROR]', { error });
    return {
      data: null,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred.' },
    }
  }
}

export const reportSessionIssueAction = withServerAction<ReportIssueParams, ActionResponseData>(
  reportSessionIssueActionInternal
); 