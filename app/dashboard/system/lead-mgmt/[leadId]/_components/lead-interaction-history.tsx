"use client"

import { LeadDetails, LeadNote } from "@/utils/types/leads"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Mail, Phone, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface LeadInteractionHistoryProps {
  lead: LeadDetails
}

export function LeadInteractionHistory({ lead }: LeadInteractionHistoryProps) {
  const notes = lead.notes || []
  
  // Sort notes by date (newest first)
  const sortedNotes = [...notes].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  
  // Get icon based on interaction type
  const getInteractionIcon = (type: LeadNote["type"]) => {
    switch (type) {
      case "NOTE":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "EMAIL":
        return <Mail className="h-4 w-4 text-green-500" />
      case "CALL":
        return <Phone className="h-4 w-4 text-orange-500" />
      case "MEETING":
        return <Calendar className="h-4 w-4 text-purple-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />
    }
  }
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        full: date.toLocaleString()
      }
    } catch (error) {
      return {
        relative: "Invalid date",
        full: "Invalid date"
      }
    }
  }
  
  return (
    <div className="space-y-4">
      {sortedNotes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No interaction history available
        </div>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {sortedNotes.map((note) => {
              const date = formatDate(note.createdAt)
              
              return (
                <Card key={note.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getInteractionIcon(note.type)}
                        <span className="font-medium">
                          {note.type === "NOTE" ? "Note" : 
                           note.type === "EMAIL" ? "Email" : 
                           note.type === "CALL" ? "Phone Call" : 
                           "Meeting"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground" title={date.full}>
                        {date.relative}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm whitespace-pre-wrap">
                      {note.content}
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      Added by: {note.createdBy}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}
      
      {lead.lastContactedAt && (
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <strong>Last Interaction:</strong> {new Date(lead.lastContactedAt).toLocaleString()}
        </div>
      )}
      
      {lead.nextFollowUpDate && (
        <div className="text-sm text-muted-foreground">
          <strong>Next Follow-up:</strong> {new Date(lead.nextFollowUpDate).toLocaleString()}
        </div>
      )}
    </div>
  )
} 