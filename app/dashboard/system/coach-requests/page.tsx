'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { fetchCoachRequests, updateCoachRequestStatus, addCoachRequestReviewNotes } from '@/utils/actions/coach-request'
import { CoachRequestStatusEnum, type CoachRequestStatus } from '@/utils/types/coach-request-types'
import { toast } from 'sonner'
import { Loader2, Edit3 } from 'lucide-react'

// Define the structure of a CoachRequest with user details
export type CoachRequestWithUser = Awaited<ReturnType<typeof fetchCoachRequests>>['data'][0];

export default function CoachRequestsPage() {
  const [requests, setRequests] = useState<CoachRequestWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CoachRequestWithUser | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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
  
  // Assuming CoachRequestStatus enum is available or we define it
  const requestStatuses = CoachRequestStatusEnum.options;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">Coach Requests Management</h1>
      
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
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center">No coach requests found.</TableCell>
            </TableRow>
          )}
          {requests.map((req) => (
            <TableRow key={req.ulid}>
              <TableCell>{req.user?.firstName} {req.user?.lastName}</TableCell>
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
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    {requestStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
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

      {selectedRequest && (
        <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Notes for {selectedRequest.user?.firstName} {selectedRequest.user?.lastName}</DialogTitle>
              <DialogDescription>
                Add or edit review notes for this coach request.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Enter review notes..."
              rows={5}
              disabled={isUpdating}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNotesModalOpen(false)} disabled={isUpdating}>Cancel</Button>
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