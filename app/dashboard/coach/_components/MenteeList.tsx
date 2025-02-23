'use client'

import { Button } from '@/components/ui/button'
import { Mentee } from '@/utils/types/mentee'

interface MenteeListProps {
  mentees: Mentee[]
  searchTerm: string
  selectedMenteeId: string | null
  onSelectMentee: (id: string) => void
}

export function MenteeList({ mentees, searchTerm, selectedMenteeId, onSelectMentee }: MenteeListProps) {
  const filteredMentees = mentees.filter(mentee => {
    const searchLower = searchTerm.toLowerCase()
    return (
      mentee.firstName?.toLowerCase().includes(searchLower) ||
      mentee.lastName?.toLowerCase().includes(searchLower) ||
      mentee.email.toLowerCase().includes(searchLower) ||
      mentee.domainProfile?.companyName?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-2">
      {filteredMentees.map((mentee) => (
        <div
          key={mentee.ulid}
          className={`
            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
            ${selectedMenteeId === mentee.ulid 
              ? 'bg-primary/10 hover:bg-primary/15' 
              : 'hover:bg-muted'
            }
          `}
          onClick={() => onSelectMentee(mentee.ulid)}
        >
          <div className="relative">
            <img
              src={mentee.profileImageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
              alt={`${mentee.firstName} ${mentee.lastName}`}
              className="w-10 h-10 rounded-full"
            />
            <div 
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background
                ${mentee.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}
              `}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="font-medium truncate">
                {mentee.firstName} {mentee.lastName}
              </p>
              {mentee.domainProfile?.type && (
                <span className="text-xs text-muted-foreground">
                  {mentee.domainProfile.type}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {mentee.domainProfile?.companyName || mentee.email}
            </p>
          </div>
        </div>
      ))}

      {filteredMentees.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No mentees found</p>
        </div>
      )}
    </div>
  )
}

