'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/components/ui/use-toast'
import { fetchSessionDetailsById } from '@/utils/actions/sessions'
import { reportSessionIssueAction } from '@/utils/actions/support-actions'
import { TransformedSession } from '@/utils/types/session'
import { Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define issue types relevant to a coach reporting an issue
const issueTypes = [
  // Attendance Issues
  { id: 'coach_present_mentee_absent', label: 'I (Coach) showed up, but My Mentee did not' },
  { id: 'mentee_late', label: 'My Mentee showed up late' },
  { id: 'session_ended_early_by_mentee', label: 'The session ended too early (initiated by Mentee)' }, // Or a general one if preferred
  { id: 'zoom_link_not_working_for_mentee', label: 'The Zoom link did not work for My Mentee' }, // Or general

  // Payment & Refunds - Generally less applicable for coach direct reporting, but can be adapted
  // Consider if these are actions a coach takes or issues they report about the platform/mentee payment
  { id: 'coach_payment_issue', label: 'I (Coach) have an issue with my payment for this session' },
  { id: 'mentee_refund_request_unexpected', label: 'My Mentee is requesting a refund I do not agree with' },

  // Call Issues
  { id: 'call_technical_issues', label: 'There were technical issues (audio/video, lag, etc.)' },
  { id: 'call_zoom_recording_issue', label: 'The Zoom call did not record properly' },
  { id: 'call_transcript_issue', label: 'The transcript is missing or incorrect' },

  // Coach/Client Conduct
  { id: 'mentee_unprofessional_rude', label: 'My Mentee was unprofessional or rude (please explain)' },
  { id: 'session_violated_guidelines_by_mentee', label: 'This session (initiated by My Mentee) violated the platform guidelines (please explain)' },

  // Other
  { id: 'other_issue_coach', label: 'Something else happened (please explain)' },
];

export default function ReportIssuePageCoach() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<TransformedSession | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [selectedIssueType, setSelectedIssueType] = useState<string>('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    if (sessionId) {
      const loadSession = async () => {
        setIsLoadingSession(true)
        try {
          const result = await fetchSessionDetailsById({ sessionId, requestingUserRole: 'coach' } as any)
          if (result.error || !result.data) {
            setError(result.error?.message || 'Failed to load session details.')
            toast({
              title: 'Error',
              description: result.error?.message || 'Could not load session details. Please try again.',
              variant: 'destructive',
            })
            setSession(null)
          } else {
            const fetchedSession = result.data as unknown as TransformedSession
            setSession(fetchedSession)
            const now = new Date().getTime()
            const sessionStartTime = new Date(fetchedSession.startTime).getTime()
            const effectiveStatus = fetchedSession.status === 'SCHEDULED' && sessionStartTime < now ? 'COMPLETED' : fetchedSession.status
            if (effectiveStatus !== 'COMPLETED') {
                toast({ title: 'Invalid Session', description: 'Support requests can only be made for completed sessions.', variant: 'destructive' })
                router.back()
            }
          }
        } catch (e: any) {
          setError('An unexpected error occurred while fetching session details.')
          toast({ title: 'Error', description: e.message || 'Failed to load session details.', variant: 'destructive' })
          setSession(null)
        }
        setIsLoadingSession(false)
      }
      loadSession()
    }
  }, [sessionId, toast, router])

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSuccessModal && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (showSuccessModal && countdown === 0) {
      router.push('/dashboard/coach/sessions');
      setShowSuccessModal(false); // Hide modal after redirecting
    }
    return () => clearTimeout(timer);
  }, [showSuccessModal, countdown, router]);

  const handleModalRedirect = () => {
    setShowSuccessModal(false);
    router.push('/dashboard/coach/sessions');
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedIssueType) {
      setError('Please select an issue type.')
      return
    }
    if (!description.trim()) {
      setError('Please provide a description of the issue.')
      return
    }
    if (!session) {
      setError('Session details are not loaded.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const submissionParams = {
        sessionId: session.ulid,
        issueType: selectedIssueType,
        description: description.trim(),
      }
      const result = await reportSessionIssueAction(submissionParams as any)

      if (result.error) {
        const errorMessage = typeof result.error === 'object' && result.error.message 
                            ? result.error.message 
                            : (typeof result.error === 'string' ? result.error : 'An unknown error occurred')
        setError(errorMessage)
        toast({ title: 'Submission Failed', description: errorMessage, variant: 'destructive' })
      } else {
        toast({ title: 'Support Request Submitted', description: 'Your issue has been reported. We will get back to you soon.' })
        setCountdown(4); // Reset countdown
        setShowSuccessModal(true);
      }
    } catch (e: any) {
      setError('An unexpected error occurred.')
      toast({ title: 'Error', description: e.message || 'Failed to submit your report.', variant: 'destructive' })
    }
    setIsSubmitting(false)
  }

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading session details...</p>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" /> Error Loading Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!session) return null;

  const otherPartyName = [session.otherParty.firstName, session.otherParty.lastName].filter(Boolean).join(' ') || 'The other party';

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Report an Issue</CardTitle>
          <CardDescription>
            Report a problem with your session on {format(new Date(session.startTime), 'PPP p')} with {otherPartyName}.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="issueType">Issue Type</Label>
              <RadioGroup
                id="issueType"
                value={selectedIssueType}
                onValueChange={setSelectedIssueType}
                className="space-y-1"
              >
                {issueTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.id} id={type.id} />
                    <Label htmlFor={type.id} className="font-normal">
                      {/* Adjust labels for coach's perspective if necessary */}
                      {type.label.replace('My Mentee', otherPartyName).replace('Coach', 'you')}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Please provide details about the issue...`}
                rows={5}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-100 p-3 rounded-md border border-red-200">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
                <div>{error}</div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedIssueType || !description.trim()}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                'Submit Report'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Support Request Submitted!</AlertDialogTitle>
            <AlertDialogDescription>
              Thank you for your report. Our support team will review your issue as quickly as possible.
              You will be redirected in {countdown}...
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={handleModalRedirect}>Return to Dashboard</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 