'use client'

import { Button } from '@/components/ui/button'

interface Mentee {
  id: number
  firstName: string | null
  lastName: string | null
  email: string
  profileImageUrl: string | null
  realtorProfile: {
    id: number
    companyName: string | null
    licenseNumber: string | null
    phoneNumber: string | null
  } | null
}

interface MenteeListProps {
  mentees: Mentee[]
  searchTerm: string
  onSelectMentee: (id: number) => void
  selectedMenteeId: number | null
}

export function MenteeList({ mentees, searchTerm, onSelectMentee, selectedMenteeId }: MenteeListProps) {
  const filteredMentees = mentees.filter(mentee => {
    const fullName = `${mentee.firstName || ''} ${mentee.lastName || ''}`.toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    return fullName.includes(searchLower) || mentee.email.toLowerCase().includes(searchLower)
  })

  return (
    <div className='space-y-2'>
      {filteredMentees.map(mentee => (
        <Button
          key={mentee.id}
          variant={selectedMenteeId === mentee.id ? 'default' : 'outline'}
          className='w-full justify-start p-6'
          onClick={() => onSelectMentee(mentee.id)}
        >
          <div className='text-left'>
            <div>{`${mentee.firstName || ''} ${mentee.lastName || ''}`}</div>
            <div className='text-sm text-muted-foreground'>{mentee.email}</div>
          </div>
        </Button>
      ))}
      {filteredMentees.length === 0 && (
        <p className="text-muted-foreground">No mentees found</p>
      )}
    </div>
  )
}

