'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  User,
  Users,
  Calendar,
  FileText,
  Briefcase,
  Award,
  Link as LinkIcon,
  Mail,
  Phone,
  Clock
} from 'lucide-react';
import { COACH_APPLICATION_STATUS } from '@/utils/types/coach-application';
import type { CoachApplication } from '@/utils/types/coach-application';
import { getCoachApplication, reviewCoachApplication, getSignedResumeUrl } from '@/utils/actions/coach-application';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/ui/pagination';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import clsx from 'clsx';

type CoachApplicationStatusType = (typeof COACH_APPLICATION_STATUS)[keyof typeof COACH_APPLICATION_STATUS];
type ReviewStatusType = 'pending' | 'approved' | 'rejected';

const ITEMS_PER_PAGE = 10;

// Update the applicant type in your CoachApplication type
type Applicant = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export default function CoachApplicationsPage() {
  const [applications, setApplications] = useState<CoachApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CoachApplicationStatusType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<CoachApplication | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await getCoachApplication();
        setApplications(data || []);
      } catch (error) {
        console.error('[FETCH_APPLICATIONS_ERROR]', error);
        toast.error('Failed to fetch applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleReview = async (applicationId: number, status: ReviewStatusType) => {
    setProcessingIds(prev => [...prev, applicationId]);
    try {
      const result = await reviewCoachApplication({
        applicationId,
        status,
        notes: reviewNotes[applicationId]
      });

      if (!result) throw new Error('Failed to review application');

      // Update local state
      const now = new Date().toISOString();
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? {
              ...app,
              status,
              notes: reviewNotes[applicationId] || null,
              reviewedAt: now,
              updatedAt: now,
            }
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

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      const matchesSearch =
        search === '' ||
        `${app.applicant?.firstName} ${app.applicant?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        app.applicant?.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc'
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        const nameA = `${a.applicant?.firstName} ${a.applicant?.lastName}`;
        const nameB = `${b.applicant?.firstName} ${b.applicant?.lastName}`;
        return sortOrder === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
      }
    });

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy, sortOrder]);

  // Handle bulk actions
  const handleBulkAction = async (status: ReviewStatusType) => {
    if (!selectedIds.length) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${status.toLowerCase()} ${selectedIds.length} application(s)?`
    );

    if (!confirmed) return;

    setProcessingIds(selectedIds);

    try {
      await Promise.all(
        selectedIds.map(id =>
          reviewCoachApplication({
            applicationId: id,
            status,
            notes: reviewNotes[id]
          })
        )
      );

      // Update local state
      const now = new Date().toISOString();
      setApplications(prev =>
        prev.map(app =>
          selectedIds.includes(app.id)
            ? {
              ...app,
              status,
              notes: reviewNotes[app.id] || null,
              reviewedAt: now,
              updatedAt: now,
            }
            : app
        )
      );

      setSelectedIds([]);
      toast.success(`Successfully ${status.toLowerCase()} ${selectedIds.length} application(s)`);
    } catch (error) {
      console.error('[BULK_REVIEW_ERROR]', error);
      toast.error('Failed to process bulk action');
    } finally {
      setProcessingIds([]);
    }
  };

  // Stats calculation
  const stats = applications.reduce(
    (acc, app) => ({
      ...acc,
      [app.status]: (acc[app.status] || 0) + 1
    }),
    {} as Record<CoachApplicationStatusType, number>
  );

  const handleViewApplication = async (application: CoachApplication) => {
    setSelectedApplication(application);
    if (application.resumeUrl) {
      const url = await getSignedResumeUrl(application.resumeUrl);
      setResumeUrl(url);
    }
  };

  const handleCloseDialog = () => {
    setSelectedApplication(null);
    setResumeUrl(null);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Coach Applications</h1>

        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-lg shadow space-y-1">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold">{stats[COACH_APPLICATION_STATUS.PENDING] || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow space-y-1">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats[COACH_APPLICATION_STATUS.APPROVED] || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow space-y-1">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats[COACH_APPLICATION_STATUS.REJECTED] || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value={COACH_APPLICATION_STATUS.PENDING}>Pending</SelectItem>
              <SelectItem value={COACH_APPLICATION_STATUS.APPROVED}>Approved</SelectItem>
              <SelectItem value={COACH_APPLICATION_STATUS.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
            <Button
              size="sm"
              onClick={() => handleBulkAction(COACH_APPLICATION_STATUS.APPROVED)}
              disabled={processingIds.length > 0}
            >
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction(COACH_APPLICATION_STATUS.REJECTED)}
              disabled={processingIds.length > 0}
            >
              Reject Selected
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {paginatedApplications.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedApplications.map((application) => (
              <Card 
                key={application.id} 
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Section - Checkbox & User Info */}
                    <div className="flex items-start gap-4">
                      {application.status === COACH_APPLICATION_STATUS.PENDING && (
                        <Checkbox
                          checked={selectedIds.includes(application.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds(prev =>
                              checked
                                ? [...prev, application.id]
                                : prev.filter(id => id !== application.id)
                            );
                          }}
                          className="mt-2"
                        />
                      )}
                      
                      <div className="space-y-3">
                        {/* User Details */}
                        <div>
                          <h3 className="text-lg font-semibold">
                            {application.applicant?.firstName} {application.applicant?.lastName}
                          </h3>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm">{application.applicant?.email}</span>
                          </div>
                        </div>
                        
                        {/* Application Details */}
                        <div className="flex gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground">Experience</p>
                            <p className="font-medium">{application.experience} years</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Applied</p>
                            <p className="font-medium">
                              {format(new Date(application.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Status & Action */}
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="secondary"
                        className={clsx(
                          "px-3 py-1",
                          application.status === COACH_APPLICATION_STATUS.PENDING && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                          application.status === COACH_APPLICATION_STATUS.APPROVED && "bg-green-100 text-green-800 hover:bg-green-100",
                          application.status === COACH_APPLICATION_STATUS.REJECTED && "bg-red-100 text-red-800 hover:bg-red-100"
                        )}
                      >
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewApplication(application)}
                        className="whitespace-nowrap"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Detailed View Dialog */}
      <Dialog open={selectedApplication !== null} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle>Coach Application Review</DialogTitle>
                <DialogDescription>
                  Submitted on {format(new Date(selectedApplication.createdAt), 'MMMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-8 py-4">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-500">Full Name</Label>
                        <p className="font-medium">
                          {selectedApplication.applicant?.firstName} {selectedApplication.applicant?.lastName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Email</Label>
                        <p className="font-medium">{selectedApplication.applicant?.email}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Years of Experience</Label>
                        <p className="font-medium">{selectedApplication.experience} years</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Professional Links</h3>
                    <div className="space-y-4">
                      {selectedApplication.linkedIn && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-gray-500" />
                          <a
                            href={selectedApplication.linkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                      {selectedApplication.primarySocialMedia && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-gray-500" />
                          <a
                            href={selectedApplication.primarySocialMedia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Primary Social Media
                          </a>
                        </div>
                      )}
                      {resumeUrl && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Resume
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Areas of Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedApplication.additionalInfo}
                    </p>
                  </div>

                  {selectedApplication.status === COACH_APPLICATION_STATUS.PENDING && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Review Decision</h3>
                      <Textarea
                        placeholder="Add review notes..."
                        value={reviewNotes[selectedApplication.id] || ''}
                        onChange={(e) => setReviewNotes(prev => ({
                          ...prev,
                          [selectedApplication.id]: e.target.value
                        }))}
                      />
                      <div className="flex gap-4">
                        <Button
                          onClick={() => handleReview(selectedApplication.id, COACH_APPLICATION_STATUS.APPROVED)}
                          disabled={processingIds.includes(selectedApplication.id)}
                          className="flex-1"
                        >
                          {processingIds.includes(selectedApplication.id) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReview(selectedApplication.id, COACH_APPLICATION_STATUS.REJECTED)}
                          disabled={processingIds.includes(selectedApplication.id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          {processingIds.includes(selectedApplication.id) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedApplication.status !== COACH_APPLICATION_STATUS.PENDING && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Review Information</h3>
                      <div>
                        <Label className="text-gray-500">Status</Label>
                        <Badge
                          className={clsx(
                            "mt-1",
                            selectedApplication.status === COACH_APPLICATION_STATUS.APPROVED && "bg-green-100 text-green-800",
                            selectedApplication.status === COACH_APPLICATION_STATUS.REJECTED && "bg-red-100 text-red-800"
                          )}
                        >
                          {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                        </Badge>
                      </div>
                      {selectedApplication.reviewDate && (
                        <div>
                          <Label className="text-gray-500">Review Date</Label>
                          <p className="font-medium">
                            {format(new Date(selectedApplication.reviewDate), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      )}
                      {selectedApplication.notes && (
                        <div>
                          <Label className="text-gray-500">Review Notes</Label>
                          <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                            {selectedApplication.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 