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
        const result = await fetchMenteeDetails(menteeId)
        if (result.error) throw new Error(result.error.message)
        setMentee(result.data)
      } catch (error) {
        console.error('[MENTEE_DETAILS_ERROR]', error)
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
          const newNote = result.data as Note
          setMentee(prev => prev ? {
            ...prev,
            notes: [...prev.notes, newNote]
          } : null)
          setNewNote('')
          toast.success('Note added successfully')
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

  if (!mentee) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center">
        <Activity className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">
          No mentee details available
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <img
          src={mentee.profileImageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
          alt={`${mentee.firstName} ${mentee.lastName}`}
          className="w-24 h-24 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">
              {mentee.firstName} {mentee.lastName}
            </h2>
            <Badge variant={mentee.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {mentee.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{mentee.email}</p>
          {mentee.domainProfile?.type && (
            <Badge variant="outline" className="mt-2">
              {mentee.domainProfile.type}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {/* Professional Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Professional Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mentee.domainProfile && (
                <>
                  <div>
                    <p className="font-medium">Company</p>
                    <p className="text-muted-foreground">{mentee.domainProfile.companyName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium">License Number</p>
                    <p className="text-muted-foreground">{mentee.domainProfile.licenseNumber || 'Not specified'}</p>
                  </div>
                  {mentee.domainProfile.type === 'REALTOR' && (
                    <>
                      <div>
                        <p className="font-medium">Phone Number</p>
                        <p className="text-muted-foreground">{mentee.domainProfile.phoneNumber || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Years of Experience</p>
                        <p className="text-muted-foreground">{mentee.domainProfile.yearsExperience || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Property Types</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {mentee.domainProfile.propertyTypes.length > 0 ? (
                            mentee.domainProfile.propertyTypes.map((type) => (
                              <Badge key={type} variant="secondary">{type}</Badge>
                            ))
                          ) : (
                            <p className="text-muted-foreground">None specified</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  {/* Add similar sections for other domain types */}
                </>
              )}
            </CardContent>
          </Card>

          {/* Mentee Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Mentee Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mentee.menteeProfile && (
                <>
                  <div>
                    <p className="font-medium">Focus Areas</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mentee.menteeProfile.focusAreas.length > 0 ? (
                        mentee.menteeProfile.focusAreas.map((area) => (
                          <Badge key={area} variant="secondary">{area}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">None specified</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Experience Level</p>
                    <p className="text-muted-foreground">{mentee.menteeProfile.experienceLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Learning Style</p>
                    <p className="text-muted-foreground">{mentee.menteeProfile.learningStyle || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Sessions Completed</p>
                    <p className="text-muted-foreground">{mentee.menteeProfile.sessionsCompleted}</p>
                  </div>
                  <div>
                    <p className="font-medium">Last Session</p>
                    <p className="text-muted-foreground">
                      {mentee.menteeProfile.lastSessionDate 
                        ? new Date(mentee.menteeProfile.lastSessionDate).toLocaleDateString()
                        : 'No sessions yet'
                      }
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mentee.domainProfile && (
                <>
                  <div>
                    <p className="font-medium">Specializations</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mentee.domainProfile.specializations.length > 0 ? (
                        mentee.domainProfile.specializations.map((spec) => (
                          <Badge key={spec} variant="secondary">{spec}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">None specified</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Certifications</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mentee.domainProfile.certifications.length > 0 ? (
                        mentee.domainProfile.certifications.map((cert) => (
                          <Badge key={cert} variant="secondary">{cert}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">None specified</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Languages</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mentee.domainProfile.languages.length > 0 ? (
                        mentee.domainProfile.languages.map((lang) => (
                          <Badge key={lang} variant="secondary">{lang}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">None specified</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Primary Market</p>
                    <p className="text-muted-foreground">{mentee.domainProfile.primaryMarket || 'Not specified'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Coaching Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mentee.sessions.length > 0 ? (
                <div className="space-y-4">
                  {mentee.sessions.map((session) => (
                    <div key={session.ulid} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium">
                            {new Date(session.startTime).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Badge variant={
                          session.status === 'COMPLETED' ? 'default' :
                          session.status === 'SCHEDULED' ? 'secondary' :
                          'destructive'
                        }>
                          {session.status}
                        </Badge>
                      </div>
                      {session.notes.length > 0 && (
                        <div className="mt-2 space-y-2 pl-4 border-l-2">
                          {session.notes.map((note) => {
                            const isExpanded = expandedNotes[note.ulid]
                            const isLongNote = note.content.length > 150

                            return (
                              <div key={note.ulid} className="relative">
                                <div className="text-sm text-muted-foreground mb-1">
                                  {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-sm pr-8">
                                  {isLongNote && !isExpanded ? (
                                    `${note.content.slice(0, 150)}...`
                                  ) : (
                                    note.content
                                  )}
                                </div>
                                {isLongNote && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0"
                                    onClick={() => setExpandedNotes(prev => ({
                                      ...prev,
                                      [note.ulid]: !prev[note.ulid]
                                    }))}
                                  >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No sessions found</p>
              )}
            </CardContent>
          </Card>
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

