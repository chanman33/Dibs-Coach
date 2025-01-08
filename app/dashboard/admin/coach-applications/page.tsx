'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { COACH_APPLICATION_STATUS } from '@/utils/types';
import { getCoachApplication, reviewCoachApplication } from '@/utils/actions/coach-application';

export default function CoachApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [processingIds, setProcessingIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        console.log('[DEBUG] Fetching applications...');
        const data = await getCoachApplication();
        console.log('[DEBUG] Received applications:', {
          data,
          count: data?.length,
          firstApp: data?.[0]
        });
        setApplications(data);
      } catch (error) {
        console.error('[FETCH_APPLICATIONS_ERROR]', error);
        toast.error('Failed to fetch applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleReview = async (applicationId: number, status: typeof COACH_APPLICATION_STATUS[keyof typeof COACH_APPLICATION_STATUS]) => {
    setProcessingIds(prev => [...prev, applicationId]);
    try {
      await reviewCoachApplication({
        applicationId,
        status,
        notes: reviewNotes[applicationId]
      });
      
      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status, notes: reviewNotes[applicationId] }
            : app
        )
      );
      
      toast.success(`Application ${status === COACH_APPLICATION_STATUS.APPROVED ? 'approved' : 'rejected'}`);
    } catch (error) {
      console.error('[REVIEW_APPLICATION_ERROR]', error);
      toast.error('Failed to review application');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== applicationId));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Coach Applications</h1>
      
      <div className="grid gap-6">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          applications.map((application: any) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {application.applicant.firstName} {application.applicant.lastName}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    application.status === COACH_APPLICATION_STATUS.PENDING
                      ? 'bg-yellow-100 text-yellow-800'
                      : application.status === COACH_APPLICATION_STATUS.APPROVED
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-500">{application.applicant.email}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Experience</Label>
                  <p className="mt-1">{application.experience}</p>
                </div>
                
                <div>
                  <Label>Specialties</Label>
                  <p className="mt-1">{application.specialties.join(', ')}</p>
                </div>

                {application.status === COACH_APPLICATION_STATUS.PENDING && (
                  <>
                    <div>
                      <Label htmlFor={`notes-${application.id}`}>Review Notes</Label>
                      <Textarea
                        id={`notes-${application.id}`}
                        value={reviewNotes[application.id] || ''}
                        onChange={(e) => setReviewNotes(prev => ({
                          ...prev,
                          [application.id]: e.target.value
                        }))}
                        placeholder="Add notes about this application..."
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleReview(application.id, COACH_APPLICATION_STATUS.APPROVED)}
                        disabled={processingIds.includes(application.id)}
                        className="flex-1"
                      >
                        {processingIds.includes(application.id) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      
                      <Button
                        onClick={() => handleReview(application.id, COACH_APPLICATION_STATUS.REJECTED)}
                        disabled={processingIds.includes(application.id)}
                        variant="destructive"
                        className="flex-1"
                      >
                        {processingIds.includes(application.id) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </>
                )}

                {application.notes && (
                  <div>
                    <Label>Admin Notes</Label>
                    <p className="mt-1">{application.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 