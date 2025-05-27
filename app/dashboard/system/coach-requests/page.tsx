'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchCoachRequests, updateCoachRequestStatus, addCoachRequestReviewNotes } from '@/utils/actions/coach-request'
import { CoachRequestStatusEnum, type CoachRequestStatus } from '@/utils/types/coach-request-types'
import { toast } from 'sonner'
import { Loader2, Edit3, Search, Users, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

// Define the structure of a CoachRequest with user details
export type CoachRequestWithUser = Awaited<ReturnType<typeof fetchCoachRequests>>['data'][0];

function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-[120px]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Skeleton className="h-8 w-[60px]" />
              </div>
              <div className="text-xs text-muted-foreground">
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getStatusBadgeVariant(status: CoachRequestStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'MATCHED':
      return 'default'
    case 'CLOSED':
      return 'destructive'
    case 'PENDING':
      return 'secondary'
    case 'REVIEWED':
      return 'outline'
    default:
      return 'secondary'
  }
}

export default function CoachRequestsPage() {
  const [requests, setRequests] = useState<CoachRequestWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CoachRequestWithUser | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CoachRequestStatus | 'ALL'>('ALL');

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      const result = await fetchCoachRequests();
      if (result.error) {
        toast.error(result.error.message || 'Failed to load coach requests.');
        setRequests([]);
      } else {
        setRequests(result.data || []);
      }
      setIsLoading(false);
    };
    loadRequests();
  }, []);

  const handleStatusChange = async (ulid: string, newStatus: CoachRequestStatus) => {
    setIsUpdating(true);
    const result = await updateCoachRequestStatus({ ulid, status: newStatus });
    if (result.error) {
      toast.error(result.error.message || 'Failed to update status.');
    } else {
      toast.success('Request status updated!');
      setRequests(prev => prev.map(req => req.ulid === ulid ? { ...req, status: newStatus as any } : req));
    }
    setIsUpdating(false);
  };

  const openNotesModal = (request: CoachRequestWithUser) => {
    setSelectedRequest(request);
    setReviewNotes(request.reviewNotes || '');
    setIsNotesModalOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;
    setIsUpdating(true);
    const result = await addCoachRequestReviewNotes({ ulid: selectedRequest.ulid, notes: reviewNotes });
    if (result.error) {
      toast.error(result.error.message || 'Failed to save notes.');
    } else {
      toast.success('Review notes saved!');
      setRequests(prev => prev.map(req => req.ulid === selectedRequest.ulid ? { ...req, reviewNotes } : req));
      setIsNotesModalOpen(false);
      setSelectedRequest(null);
    }
    setIsUpdating(false);
  };

  // Filter and search logic
  const filteredRequests = requests.filter(req => {
    const matchesSearch = searchQuery.toLowerCase() === '' ||
      req.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestDetails?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    reviewed: requests.filter(r => r.status === 'REVIEWED').length,
    matched: requests.filter(r => r.status === 'MATCHED').length,
    closed: requests.filter(r => r.status === 'CLOSED').length,
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Coach Requests Management</h1>
        <p className="text-muted-foreground">Review and manage incoming coach applications and requests.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewed}</div>
            <p className="text-xs text-muted-foreground">Search in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matched</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matched}</div>
            <p className="text-xs text-muted-foreground">Successfully matched</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">Process completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Coach Requests</CardTitle>
              <CardDescription>Manage and review coaching applications</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CoachRequestStatus | 'ALL')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {CoachRequestStatusEnum.options.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery || statusFilter !== 'ALL'
                  ? "No requests match your search criteria"
                  : "No coach requests have been submitted yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.ulid}>
                    <TableCell className="font-medium">{req.user?.firstName} {req.user?.lastName}</TableCell>
                    <TableCell>{req.user?.email}</TableCell>
                    <TableCell className="max-w-xs truncate">{req.requestDetails}</TableCell>
                    <TableCell>{req.preferredDomain || 'N/A'}</TableCell>
                    <TableCell>{req.preferredSkills?.join(', ') || 'N/A'}</TableCell>
                    <TableCell>
                      <Select 
                        value={req.status} 
                        onValueChange={(newStatus) => handleStatusChange(req.ulid, newStatus as CoachRequestStatus)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>
                            <Badge variant={getStatusBadgeVariant(req.status as CoachRequestStatus)}>
                              {req.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {CoachRequestStatusEnum.options.map(status => (
                            <SelectItem key={status} value={status}>
                              <Badge variant={getStatusBadgeVariant(status as CoachRequestStatus)}>
                                {status}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openNotesModal(req)}>
                        <Edit3 className="h-4 w-4 mr-2" /> Notes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Review Notes</DialogTitle>
              <DialogDescription>
                Add or edit review notes for {selectedRequest.user?.firstName} {selectedRequest.user?.lastName}'s request
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter review notes..."
                rows={5}
                disabled={isUpdating}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNotesModalOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleSaveNotes} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 