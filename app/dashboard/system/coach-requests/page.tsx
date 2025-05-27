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
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

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

function RequestDetailsModal({ 
  request, 
  isOpen, 
  onClose,
  onStatusChange,
  onNotesChange,
  isUpdating 
}: { 
  request: CoachRequestWithUser | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (ulid: string, status: CoachRequestStatus) => Promise<void>
  onNotesChange: (ulid: string, notes: string) => Promise<void>
  isUpdating: boolean
}) {
  const [notes, setNotes] = useState(request?.reviewNotes || '')

  useEffect(() => {
    setNotes(request?.reviewNotes || '')
  }, [request])

  if (!request) return null

  const handleSaveNotes = async () => {
    await onNotesChange(request.ulid, notes)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Coach Request Details</DialogTitle>
          <DialogDescription>
            Submitted on {format(new Date(request.createdAt), 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Mentee Information</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">
                    {request.user?.firstName || ''} {request.user?.lastName || ''}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{request.user?.email}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Request Details</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Preferred Domain</Label>
                  <p className="font-medium">{request.preferredDomain || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Skills & Expertise</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {request.preferredSkills?.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    )) || 'Not specified'}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Additional Details</Label>
                  <div className="bg-muted/20 rounded-lg p-4">
                    <p className="whitespace-pre-wrap">{request.requestDetails}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Select 
                      value={request.status} 
                      onValueChange={(newStatus) => onStatusChange(request.ulid, newStatus as CoachRequestStatus)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue>
                          <Badge variant={getStatusBadgeVariant(request.status as CoachRequestStatus)}>
                            {request.status}
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
                  </div>
                </div>

                <Separator />

                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add review notes..."
                  className="min-h-[200px]"
                />
                <Button 
                  onClick={handleSaveNotes} 
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Notes
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mt-4">
              <p>Last updated: {format(new Date(request.updatedAt), 'MMMM d, yyyy HH:mm')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CoachRequestsPage() {
  const [requests, setRequests] = useState<CoachRequestWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CoachRequestWithUser | null>(null);
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

  const handleNotesChange = async (ulid: string, notes: string) => {
    setIsUpdating(true);
    const result = await addCoachRequestReviewNotes({ ulid, notes });
    if (result.error) {
      toast.error(result.error.message || 'Failed to save notes.');
    } else {
      toast.success('Review notes saved!');
      setRequests(prev => prev.map(req => req.ulid === ulid ? { ...req, reviewNotes: notes } : req));
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow 
                    key={req.ulid}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell 
                      className="font-medium"
                      onClick={() => setSelectedRequest(req)}
                    >{req.user?.firstName} {req.user?.lastName}</TableCell>
                    <TableCell 
                      onClick={() => setSelectedRequest(req)}
                    >{req.user?.email}</TableCell>
                    <TableCell 
                      className="max-w-xs truncate"
                      onClick={() => setSelectedRequest(req)}
                    >{req.requestDetails}</TableCell>
                    <TableCell 
                      onClick={() => setSelectedRequest(req)}
                    >{req.preferredDomain || 'N/A'}</TableCell>
                    <TableCell 
                      className="max-w-xs truncate"
                      onClick={() => setSelectedRequest(req)}
                    >{req.preferredSkills?.join(', ') || 'N/A'}</TableCell>
                    <TableCell onClick={() => setSelectedRequest(req)}>
                      <Badge variant={getStatusBadgeVariant(req.status as CoachRequestStatus)}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell 
                      onClick={() => setSelectedRequest(req)}
                    >{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(req);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <RequestDetailsModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onStatusChange={handleStatusChange}
        onNotesChange={handleNotesChange}
        isUpdating={isUpdating}
      />
    </div>
  );
} 