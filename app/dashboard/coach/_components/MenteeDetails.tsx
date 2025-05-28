'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp, Maximize2, Pencil, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Badge } from "@/components/ui/badge"
import { Calendar, MessageSquare, Activity, Building2, Award, Globe2, Languages } from "lucide-react"
import { toast } from 'sonner'
import { Mentee, Note, Session } from '@/utils/types/mentee'
import { fetchMenteeDetails, addNote as addNoteAction } from '@/utils/actions/mentee-actions'

interface MenteeDetailsProps {
  menteeId: string
}

export function MenteeDetails({ menteeId }: MenteeDetailsProps) {
  const [mentee, setMentee] = useState<Mentee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  useEffect(() => {
    const loadMenteeDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await fetchMenteeDetails(menteeId)
        
        if (result.error) {
          console.error('[MENTEE_DETAILS_ERROR]', result.error)
          throw new Error(result.error.message)
        }
        
        if (result.data) {
          setMentee(result.data)
        } else {
          throw new Error('No mentee data returned')
        }
      } catch (error) {
        console.error('[MENTEE_DETAILS_ERROR]', error)
        setError('Failed to load mentee details. Please try again later.')
        toast.error('Failed to load mentee details')
      } finally {
        setIsLoading(false)
      }
    }

    loadMenteeDetails()
  }, [menteeId])

  const handleAddNote = async () => {
    if (newNote.trim() && mentee) {
      try {
        const result = await addNoteAction({
          menteeUlid: mentee.ulid,
          content: newNote.trim()
        })

        if (result.error) throw new Error(result.error.message)

        if (result.data) {
          const noteData = result.data as Note // Ensure it's treated as a Note type
          // Ensure menteeUlid is the current mentee's ulid if it's null in the API response
          const completeNoteData = {
            ...noteData,
            relatedUserUlid: noteData.relatedUserUlid || mentee.ulid
          }
          setMentee(prev => {
            if (!prev) return null
            return {
              ...prev,
              notes: [...prev.notes, completeNoteData]
            }
          })
          setNewNote('')
          toast.success('Note added successfully')
        } else {
          throw new Error('No note data returned')
        }
      } catch (error) {
        console.error('[ADD_NOTE_ERROR]', error)
        toast.error('Failed to add note')
      }
    }
  }

  const updateNote = async () => {
    if (!selectedNote || !editedContent.trim()) return

    try {
      const response = await fetch(`/api/mentees/${mentee?.ulid}/notes/${selectedNote.ulid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      })

      if (!response.ok) throw new Error('Failed to update note')

      const updatedNote = await response.json()

      // Update the note in the UI
      setMentee(prev => {
        if (!prev) return null

        // Update in sessions if it's a session note
        const updatedSessions = prev.sessions.map(session => ({
          ...session,
          notes: session.notes.map(note => 
            note.ulid === selectedNote.ulid ? { ...note, content: updatedNote.content } : note
          )
        }))

        // Update in general notes if it's there
        const updatedNotes = prev.notes.map(note =>
          note.ulid === selectedNote.ulid ? { ...note, content: updatedNote.content } : note
        )

        return {
          ...prev,
          sessions: updatedSessions,
          notes: updatedNotes
        }
      })

      // Update the selected note to show the new content in the modal
      setSelectedNote(prev => prev ? {
        ...prev,
        content: updatedNote.content
      } : null)

      setIsEditing(false)
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const handleNoteClick = (note: Note, sessionId: string) => {
    // TODO: Implement note editing/viewing modal
    console.log('Note clicked:', note, 'Session:', sessionId)
  }

  const deleteNote = async () => {
    if (!selectedNote) return

    try {
      const response = await fetch(`/api/mentees/${mentee?.ulid}/notes/${selectedNote.ulid}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete note')

      // Update the UI by removing the deleted note
      setMentee(prev => {
        if (!prev) return null

        // Remove from sessions if it's a session note
        const updatedSessions = prev.sessions.map(session => ({
          ...session,
          notes: session.notes.filter(note => note.ulid !== selectedNote.ulid)
        }))

        // Remove from general notes if it's there
        const updatedNotes = prev.notes.filter(note => note.ulid !== selectedNote.ulid)

        return {
          ...prev,
          sessions: updatedSessions,
          notes: updatedNotes
        }
      })

      // Close both the delete alert and the note modal
      setShowDeleteAlert(false)
      setSelectedNote(null)
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !mentee) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center">
        <Activity className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">
          {error || "No mentee details available"}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Improved Header Layout */}
      <div className="flex items-start gap-6 p-2 rounded-lg border border-border/40 bg-background/50">
        <div className="relative">
          <img
            src={mentee.profileImageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
            alt={`${mentee.firstName} ${mentee.lastName}`}
            className="w-24 h-24 rounded-full border-2 border-background shadow-sm"
          />
        </div>
        
        <div className="flex-1 py-2">
          {/* Name and Professional Information */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">
                {mentee.firstName} {mentee.lastName}
              </h2>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              {mentee.domainProfile?.type && (
                <Badge variant="outline" className="px-3 py-1">
                  {mentee.domainProfile.type}
                </Badge>
              )}
              
              {mentee.domainProfile?.companyName && (
                <span className="text-sm text-muted-foreground">
                  {mentee.domainProfile.companyName}
                </span>
              )}
              
              {mentee.menteeProfile && (
                <Badge variant="secondary" className="px-2 py-0.5">
                  {mentee.menteeProfile.sessionsCompleted} {mentee.menteeProfile.sessionsCompleted === 1 ? 'Session' : 'Sessions'}
                </Badge>
              )}
            </div>
            
            {mentee.domainProfile?.phoneNumber && (
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                {mentee.domainProfile.phoneNumber}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="profile" className="rounded-md data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profile
            </div>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-md data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sessions
            </div>
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-md data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Professional Profile */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Building2 className="h-5 w-5" />
                Professional Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-5 sm:grid-cols-2">
              {mentee.domainProfile ? (
                <>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">Company</p>
                    <p>{mentee.domainProfile.companyName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">License Number</p>
                    <p>{mentee.domainProfile.licenseNumber || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">Phone Number</p>
                    <p>{mentee.domainProfile.phoneNumber || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">Years of Experience</p>
                    <p>{typeof mentee.domainProfile.totalYearsRE === 'number' ? mentee.domainProfile.totalYearsRE : 'Not specified'}</p>
                  </div>
                  {mentee.domainProfile.propertyTypes && mentee.domainProfile.propertyTypes.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="font-medium text-sm text-muted-foreground mb-1">Property Types</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {mentee.domainProfile.propertyTypes.map((type) => (
                          <Badge key={type} variant="secondary">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {mentee.domainProfile.type === 'LOAN_OFFICER' && mentee.domainProfile.nmls && (
                     <div>
                       <p className="font-medium text-sm text-muted-foreground mb-1">NMLS</p>
                       <p>{mentee.domainProfile.nmls || 'Not specified'}</p>
                     </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground sm:col-span-2">No professional profile data available.</p>
              )}
            </CardContent>
          </Card>

          {/* Mentee Profile */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Award className="h-5 w-5" />
                Mentee Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-5 sm:grid-cols-2">
              {mentee.menteeProfile && (
                <>
                  <div className="sm:col-span-2">
                    <p className="font-medium text-sm text-muted-foreground mb-1">Focus Areas</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mentee.menteeProfile.focusAreas && mentee.menteeProfile.focusAreas.length > 0 ? (
                        mentee.menteeProfile.focusAreas.map((area) => (
                          <Badge key={area} variant="secondary">{area}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">None specified</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">Experience Level</p>
                    <p>{mentee.menteeProfile.experienceLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">Learning Style</p>
                    <p>{mentee.menteeProfile.learningStyle || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">Sessions Completed</p>
                    <p className="flex items-center gap-2">
                      {mentee.menteeProfile.sessionsCompleted}
                      {mentee.menteeProfile.sessionsCompleted > 0 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {mentee.menteeProfile.lastSessionDate
                            ? `Last: ${new Date(mentee.menteeProfile.lastSessionDate).toLocaleDateString()}`
                            : ''}
                        </Badge>
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Globe2 className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid gap-5 sm:grid-cols-2">
              {mentee.domainProfile ? (
                <>
                  <div className="sm:col-span-2">
                    <p className="font-medium text-sm text-muted-foreground mb-1">Specializations</p>
                    {mentee.domainProfile.specializations && mentee.domainProfile.specializations.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {mentee.domainProfile.specializations.map((spec) => (
                          <Badge key={spec} variant="secondary">{spec}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">None specified</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <p className="font-medium text-sm text-muted-foreground mb-1">Certifications</p>
                    {mentee.domainProfile.certifications && mentee.domainProfile.certifications.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {mentee.domainProfile.certifications.map((cert) => (
                          <Badge key={cert} variant="secondary">{cert}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">None specified</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <p className="font-medium text-sm text-muted-foreground mb-1">Languages</p>
                    {mentee.domainProfile.languages && mentee.domainProfile.languages.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {mentee.domainProfile.languages.map((lang) => (
                          <Badge key={lang} variant="secondary">{lang}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">None specified</p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">Primary Market</p>
                    <p>{mentee.domainProfile.primaryMarket || 'Not specified'}</p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground sm:col-span-2">No additional information available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {mentee.sessions && mentee.sessions.length > 0 ? (
            <div className="space-y-4">
              {mentee.sessions.map((session) => (
                <Card key={session.ulid}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {new Date(session.startTime).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                      <Badge variant={
                        session.status === 'COMPLETED' 
                          ? 'default' 
                          : session.status === 'SCHEDULED' 
                            ? 'outline' 
                            : 'destructive'
                      }>
                        {session.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Duration: </span>
                      {
                        ((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60))
                      } minutes
                    </div>

                    {/* Session Notes */}
                    {session.notes && session.notes.length > 0 ? (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Session Notes
                        </h4>
                        <div className="space-y-2">
                          {session.notes.map((note) => (
                            <div 
                              key={note.ulid}
                              className="p-3 bg-muted rounded-md text-sm"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="text-xs text-muted-foreground">
                                  {new Date(note.createdAt).toLocaleString('en-US', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })}
                                </div>
                              </div>
                              <p>{note.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-muted-foreground italic">
                        No notes for this session
                      </div>
                    )}
                    
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  No coaching sessions with this mentee yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <Button onClick={handleAddNote}>Add</Button>
                </div>
                {mentee.notes.length > 0 ? (
                  <div className="space-y-4">
                    {mentee.notes.map((note) => {
                      const isExpanded = expandedNotes[note.ulid]
                      const isLongNote = note.content.length > 150

                      return (
                        <div key={note.ulid} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-muted-foreground">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                            {isLongNote && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedNotes(prev => ({
                                  ...prev,
                                  [note.ulid]: !prev[note.ulid]
                                }))}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                          <p className="text-sm">
                            {isLongNote && !isExpanded ? (
                              `${note.content.slice(0, 150)}...`
                            ) : (
                              note.content
                            )}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No notes found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog 
        open={!!selectedNote} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNote(null)
            setIsEditing(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Note from {selectedNote && new Date(selectedNote.createdAt).toLocaleString()}
            </DialogTitle>
          </DialogHeader>
          <div className='mt-4 space-y-4'>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[200px]"
              />
            ) : (
              <div className="flex flex-col min-h-[200px]">
                <div className="flex-1 text-sm whitespace-pre-wrap pb-12">
                  {selectedNote?.content}
                </div>
                <div className="flex justify-end mt-2 pt-2 border-t gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteAlert(true)}
                    className="hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          {isEditing && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setEditedContent(selectedNote?.content || '')
                }}
              >
                Cancel
              </Button>
              <Button onClick={updateNote}>Save Changes</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteNote} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
