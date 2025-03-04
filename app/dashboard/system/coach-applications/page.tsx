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
import { type ApplicationData, type ApiResponse } from '@/utils/types/coach-application';
import { 
  COACH_APPLICATION_STATUS, 
  type CoachApplicationStatus,
  REAL_ESTATE_DOMAINS,
  type RealEstateDomain
} from '@/utils/types/coach';
import { 
  getCoachApplication, 
  reviewCoachApplication, 
  getResumePresignedUrl, 
  getAllCoachApplications 
} from '@/utils/actions/coach-application';
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
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

type StatusFilter = CoachApplicationStatus | 'ALL';

const ITEMS_PER_PAGE = 10;

interface ApplicationResponse {
  ulid: string;
  status: CoachApplicationStatus;
  applicant: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    profileImageUrl: string | null;
  };
  reviewer: {
    ulid: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  yearsOfExperience: number;
  superPower: string;
  realEstateDomains: RealEstateDomain[];
  primaryDomain: RealEstateDomain;
  notes: string | null;
  reviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  resumeUrl: string | null;
  linkedIn: string | null;
  primarySocialMedia: string | null;
  aboutYou: string | null;
}

const transformSpecialties = (specialties: string[]): RealEstateDomain[] => {
  return specialties.filter((specialty): specialty is RealEstateDomain => 
    Object.values(REAL_ESTATE_DOMAINS).includes(specialty as RealEstateDomain)
  );
};

export default function CoachApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponse | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      console.log('[FETCH_APPLICATIONS_START]', 'Fetching coach applications');
      const result = await getAllCoachApplications(null);
      
      if (result.error) {
        console.error('[FETCH_APPLICATIONS_ERROR]', {
          error: result.error,
          message: 'Error returned from getAllCoachApplications'
        });
        throw new Error(result.error.message);
      }
      
      if (!result.data) {
        console.error('[FETCH_APPLICATIONS_ERROR]', {
          message: 'No data returned from server',
          result
        });
        throw new Error('No data returned from server');
      }

      console.log('[FETCH_APPLICATIONS_SUCCESS]', {
        count: result.data.length,
        sampleApplication: result.data[0] ? {
          ulid: result.data[0].ulid,
          status: result.data[0].status,
          hasApplicant: !!result.data[0].applicant,
          applicantInfo: result.data[0].applicant ? {
            firstName: !!result.data[0].applicant.firstName,
            lastName: !!result.data[0].applicant.lastName,
            email: !!result.data[0].applicant.email,
            phoneNumber: !!result.data[0].applicant.phoneNumber
          } : null
        } : 'No applications'
      });
      
      // Transform ApplicationData to ApplicationResponse
      const transformedData: ApplicationResponse[] = result.data
        .filter((app): app is ApplicationData & { applicant: NonNullable<ApplicationData['applicant']> } => 
          app.applicant !== null
        )
        .map(app => ({
          ...app,
          yearsOfExperience: app.yearsOfExperience,
          superPower: app.superPower,
          realEstateDomains: app.realEstateDomains,
          primaryDomain: app.primaryDomain,
          aboutYou: app.aboutYou,
          applicant: {
            ulid: app.applicant.ulid,
            firstName: app.applicant.firstName,
            lastName: app.applicant.lastName,
            email: app.applicant.email,
            phoneNumber: app.applicant.phoneNumber || null,
            profileImageUrl: app.applicant.profileImageUrl || null
          }
        }));
      
      setApplications(transformedData);
    } catch (error) {
      console.error('[FETCH_APPLICATIONS_ERROR]', {
        error,
        message: 'Failed to fetch applications',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch applications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleViewApplication = (application: ApplicationResponse) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
    setSelectedSpecialties(application.realEstateDomains.map(domain => domain.replace(/_/g, ' ')));
    setReviewNotes(application.notes || '');
    
    // Reset resume URL
    setResumeUrl(null);
    
    // Fetch resume URL if available
    if (application.resumeUrl) {
      const fetchResumeUrl = async () => {
        try {
          // Extract the filename from the full URL
          const resumePath = application.resumeUrl?.split('/').pop();
          if (resumePath) {
            const result = await getResumePresignedUrl(`resumes/${resumePath}`);
            if (result.data) {
              setResumeUrl(result.data);
            }
          }
        } catch (error) {
          console.error('[FETCH_RESUME_URL_ERROR]', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch resume URL',
            variant: 'destructive'
          });
        }
      };
      
      fetchResumeUrl();
    }
  };

  const handleReview = async (applicationUlid: string, status: CoachApplicationStatus) => {
    setIsSubmitting(true);
    try {
      const result = await reviewCoachApplication({
        applicationUlid,
        status,
        notes: reviewNotes,
        approvedSpecialties: status === COACH_APPLICATION_STATUS.APPROVED ? selectedSpecialties.filter((s): s is RealEstateDomain => 
          Object.values(REAL_ESTATE_DOMAINS).includes(s as RealEstateDomain)
        ) : undefined
      });

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error.message,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: `Application ${status} successfully`
      });

      // Reset state and close dialog
      setIsReviewDialogOpen(false);
      setSelectedSpecialties([]);
      setReviewNotes('');
      
      // Refresh applications
      await fetchApplications();
    } catch (error) {
      console.error('[REVIEW_APPLICATION_ERROR]', error);
      toast({
        title: 'Error',
        description: 'Failed to review application',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
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
  const handleBulkAction = async (status: CoachApplicationStatus) => {
    try {
      const selectedApplications = applications.filter(app => selectedIds.includes(app.ulid));
      
      for (const app of selectedApplications) {
        setProcessingIds(prev => [...prev, app.ulid]);
        await handleReview(app.ulid, status);
        setProcessingIds(prev => prev.filter(id => id !== app.ulid));
      }
      
      setSelectedIds([]);
    } catch (error) {
      console.error('[BULK_ACTION_ERROR]', error);
      toast({
        title: 'Error',
        description: 'Failed to process bulk action',
        variant: 'destructive'
      });
    }
  };

  // Stats calculation
  const stats = applications.reduce(
    (acc, app) => ({
      ...acc,
      [app.status]: (acc[app.status as keyof typeof COACH_APPLICATION_STATUS] || 0) + 1
    }),
    {} as Record<keyof typeof COACH_APPLICATION_STATUS, number>
  );

  // Add logging to filtered applications
  useEffect(() => {
    console.log('[FILTERED_APPLICATIONS]', {
      total: applications.length,
      filtered: filteredApplications.length,
      searchTerm: search || 'none',
      statusFilter,
      currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
      paginatedCount: paginatedApplications.length
    });
  }, [applications, filteredApplications, paginatedApplications, search, statusFilter, currentPage]);

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

          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
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
                key={application.ulid} 
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Section - Checkbox & User Info */}
                    <div className="flex items-start gap-4">
                      {application.status === COACH_APPLICATION_STATUS.PENDING && (
                        <Checkbox
                          checked={selectedIds.includes(application.ulid)}
                          onCheckedChange={(checked) => {
                            setSelectedIds(prev =>
                              checked
                                ? [...prev, application.ulid]
                                : prev.filter(id => id !== application.ulid)
                            );
                          }}
                          className="mt-2"
                        />
                      )}
                      
                      <div className="space-y-3">
                        {/* User Details */}
                        <div>
                          <h3 className="text-lg font-semibold">
                            {application.applicant?.firstName || ''} {application.applicant?.lastName || ''}
                          </h3>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm">{application.applicant?.email}</span>
                            </div>
                            {application.applicant?.phoneNumber && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span className="text-sm">{application.applicant.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Application Details */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Experience</p>
                            <p className="font-medium">{application.yearsOfExperience} years</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Applied</p>
                            <p className="font-medium">
                              {format(new Date(application.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Super Power</p>
                            <p className="font-medium">{application.superPower}</p>
                          </div>
                        </div>
                        
                        {/* Real Estate Domains */}
                        {application.realEstateDomains && application.realEstateDomains.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground">Real Estate Domains</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {application.realEstateDomains.slice(0, 3).map((domain, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {domain.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                              {application.realEstateDomains.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{application.realEstateDomains.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
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
                        {application.status}
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
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                          {selectedApplication.applicant?.firstName || ''} {selectedApplication.applicant?.lastName || ''}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Email</Label>
                        <p className="font-medium">{selectedApplication.applicant?.email}</p>
                      </div>
                      {selectedApplication.applicant?.phoneNumber && (
                        <div>
                          <Label className="text-gray-500">Phone Number</Label>
                          <p className="font-medium">{selectedApplication.applicant.phoneNumber}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-500">Years of Experience</Label>
                        <p className="font-medium">{selectedApplication.yearsOfExperience} years</p>
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
                    <h3 className="text-lg font-semibold mb-4">Super Power</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedApplication.superPower}
                    </p>
                  </div>
                  
                  {/* Real Estate Domains Section */}
                  {selectedApplication.realEstateDomains && selectedApplication.realEstateDomains.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Real Estate Domains</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.realEstateDomains.map((domain, index) => (
                          <Badge key={index} variant="outline">
                            {domain.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApplication.aboutYou && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">About You</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedApplication.aboutYou}
                      </p>
                    </div>
                  )}

                  {selectedApplication.status === COACH_APPLICATION_STATUS.PENDING && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Review Decision</h3>
                      <Textarea
                        placeholder="Add review notes..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                      />
                      <div className="flex gap-4">
                        <Button
                          onClick={() => handleReview(selectedApplication.ulid, COACH_APPLICATION_STATUS.APPROVED)}
                          disabled={processingIds.includes(selectedApplication.ulid)}
                          className="flex-1"
                        >
                          {processingIds.includes(selectedApplication.ulid) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReview(selectedApplication.ulid, COACH_APPLICATION_STATUS.REJECTED)}
                          disabled={processingIds.includes(selectedApplication.ulid)}
                          variant="destructive"
                          className="flex-1"
                        >
                          {processingIds.includes(selectedApplication.ulid) ? (
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
                          {selectedApplication.status}
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

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Review and approve or reject this coach application.
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div>
                <Label>Review Notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this application..."
                  className="mt-2"
                />
              </div>

              {/* Specialties Selection */}
              <div>
                <Label>Approved Specialties</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Select the specialties to approve for this coach
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(REAL_ESTATE_DOMAINS).map(([key, value]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={value}
                        checked={selectedSpecialties.includes(value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSpecialties([...selectedSpecialties, value]);
                          } else {
                            setSelectedSpecialties(selectedSpecialties.filter((s) => s !== value));
                          }
                        }}
                      />
                      <Label htmlFor={value}>{key.replace(/_/g, ' ')}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <Button
                  variant="destructive"
                  onClick={() => selectedApplication && handleReview(selectedApplication.ulid, COACH_APPLICATION_STATUS.REJECTED)}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => selectedApplication && handleReview(selectedApplication.ulid, COACH_APPLICATION_STATUS.APPROVED)}
                  disabled={isSubmitting || selectedSpecialties.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 