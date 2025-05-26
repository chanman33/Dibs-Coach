'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { createCoachRequest } from '@/utils/actions/coach-request' // Verify path
import { RealEstateDomain } from '@prisma/client' // Verify import
import { toast } from 'sonner' // Or your preferred toast library
import { Loader2 } from 'lucide-react'

interface RequestCoachCardProps {
  className?: string;
}

export function RequestCoachCard({ className }: RequestCoachCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [requestDetails, setRequestDetails] = useState('')
  const [preferredDomain, setPreferredDomain] = useState<RealEstateDomain | undefined>(
    undefined
  )
  const [preferredSkills, setPreferredSkills] = useState<string>('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(async () => {
      const formData = new FormData()
      formData.append('requestDetails', requestDetails)
      if (preferredDomain) {
        formData.append('preferredDomain', preferredDomain)
      }
      preferredSkills.split(',').map(skill => skill.trim()).filter(skill => skill).forEach(skill => {
        formData.append('preferredSkills', skill)
      })

      const result = await createCoachRequest(formData)

      if (result.error) {
        toast.error(result.error.message || 'Failed to submit coach request.')
        if (result.error.code === 'VALIDATION_ERROR' && result.error.details) {
          // You can handle detailed form errors here if needed
          console.error('Validation errors:', result.error.details)
        }
      } else {
        toast.success('Coach request submitted successfully!')
        setRequestDetails('')
        setPreferredDomain(undefined)
        setPreferredSkills('')
        setIsOpen(false)
      }
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Request a Coach</CardTitle>
        <CardDescription>
          Can't find the right coaching background or skill set? Tell us what you're working on and looking for help with.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Submit a Request</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Request a Coach</DialogTitle>
              <DialogDescription>
                Fill out the details below and we'll help find a match for you.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="requestDetails">What are you working on?</Label>
                <Textarea
                  id="requestDetails"
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  placeholder="Describe your goals, challenges, and what you're looking for in a coach."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preferredDomain">Preferred Domain (Optional)</Label>
                <select
                  id="preferredDomain"
                  value={preferredDomain || ''}
                  onChange={(e) =>
                    setPreferredDomain(e.target.value as RealEstateDomain || undefined)
                  }
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a domain (optional)</option>
                  {Object.values(RealEstateDomain).map((domain) => (
                    <option key={domain} value={domain}>
                      {domain.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preferredSkills">Preferred Skills (Optional, comma-separated)</Label>
                <Input
                  id="preferredSkills"
                  value={preferredSkills}
                  onChange={(e) => setPreferredSkills(e.target.value)}
                  placeholder="e.g., Lead Generation, Negotiation, CRM Management"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 