'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, ExternalLink, User, Users } from 'lucide-react';
import { COACH_APPLICATION_STATUS, type CoachApplicationStatusType } from '@/utils/types/coach';
import type { CoachApplication } from '@/utils/types/coach-application';
import { getCoachApplication, reviewCoachApplication } from '@/utils/actions/coach-application';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/ui/pagination';
import Link from 'next/link';

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

  const handleReview = async (applicationId: number, status: CoachApplicationStatusType) => {
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
  const handleBulkAction = async (status: CoachApplicationStatusType) => {
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
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
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
                        />
                      )}
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          {application.applicant?.firstName} {application.applicant?.lastName}
                          <div className="flex gap-2">
                            {application.applicantDbId && (
                              <Link
                                href={`/dashboard/admin/users/${application.applicantDbId}`}
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                                title="View User Profile"
                              >
                                <User className="h-4 w-4" />
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                            {application.applicantDbId && (
                              <Link
                                href={`/dashboard/admin/mentees/${application.applicantDbId}`}
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                                title="View Mentee Profile"
                              >
                                <Users className="h-4 w-4" />
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </h2>
                        <p className="text-gray-500">{application.applicant?.email}</p>
                      </div>
                    </div>
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
    </div>
  );
} 