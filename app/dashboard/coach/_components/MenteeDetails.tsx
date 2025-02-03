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

interface MenteeDetailsProps {
  menteeId: number
}

interface MenteeData {
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
  goals: { id: number; content: string; status: string }[]
  sessions: { 
    id: number
    durationMinutes: number
    status: string
    createdAt: string
    notes: {
      id: number
      content: string
      createdAt: string
    }[]
  }[]
  notes: { 
    id: number
    content: string
    createdAt: string
    updatedAt: string
  }[]
}

interface SelectedNote {
  id: number
  content: string
  createdAt: string
  sessionId?: number
}

export function MenteeDetails({ menteeId }: MenteeDetailsProps) {
  const [menteeData, setMenteeData] = useState<MenteeData | null>(null)
  const [newNote, setNewNote] = useState('')
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({})
  const [selectedNote, setSelectedNote] = useState<SelectedNote | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  useEffect(() => {
    const fetchMenteeData = async () => {
      try {
        const response = await fetch(`/api/mentees/${menteeId}`)
        const data = await response.json()
        console.log('Fetched mentee data:', data)
        setMenteeData(data)
      } catch (error) {
        console.error('Error fetching mentee data:', error)
        setMenteeData(null)
      }
    }
    fetchMenteeData()
  }, [menteeId])

  const addNote = async () => {
    if (newNote.trim() && menteeData) {
      try {
        const response = await fetch(`/api/mentees/${menteeId}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newNote }),
        })
        
        if (!response.ok) throw new Error('Failed to add note')
        
        const newNoteData = await response.json()
        setMenteeData(prev => prev ? {
          ...prev,
          notes: [...prev.notes, newNoteData]
        } : null)
        setNewNote('')
      } catch (error) {
        console.error('Error adding note:', error)
      }
    }
  }

  const updateNote = async () => {
    if (!selectedNote || !editedContent.trim()) return

    try {
      const response = await fetch(`/api/mentees/${menteeId}/notes/${selectedNote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      })

      if (!response.ok) throw new Error('Failed to update note')

      const updatedNote = await response.json()

      // Update the note in the UI
      setMenteeData(prev => {
        if (!prev) return null

        // Update in sessions if it's a session note
        const updatedSessions = prev.sessions.map(session => ({
          ...session,
          notes: session.notes.map(note => 
            note.id === selectedNote.id ? { ...note, content: updatedNote.content } : note
          )
        }))

        // Update in general notes if it's there
        const updatedNotes = prev.notes.map(note =>
          note.id === selectedNote.id ? { ...note, content: updatedNote.content } : note
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

  const handleNoteClick = (note: { id: number; content: string; createdAt: string }, sessionId?: number) => {
    setSelectedNote({ id: note.id, content: note.content, createdAt: note.createdAt, sessionId })
    setEditedContent(note.content)
    setIsEditing(false)
  }

  const deleteNote = async () => {
    if (!selectedNote) return

    try {
      const response = await fetch(`/api/mentees/${menteeId}/notes/${selectedNote.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete note')

      // Update the UI by removing the deleted note
      setMenteeData(prev => {
        if (!prev) return null

        // Remove from sessions if it's a session note
        const updatedSessions = prev.sessions.map(session => ({
          ...session,
          notes: session.notes.filter(note => note.id !== selectedNote.id)
        }))

        // Remove from general notes if it's there
        const updatedNotes = prev.notes.filter(note => note.id !== selectedNote.id)

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

  if (!menteeData) return <div>Loading...</div>

  return (
    <div className='pt-8 space-y-4'>
      <div className='flex items-center gap-4'>
        <Avatar className='h-20 w-20'>
          <AvatarImage src={menteeData.profileImageUrl || undefined} alt={`${menteeData.firstName} ${menteeData.lastName}`} />
          <AvatarFallback>{menteeData.firstName?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className='text-2xl font-bold'>{`${menteeData.firstName || ''} ${menteeData.lastName || ''}`}</h2>
          <p className='text-muted-foreground'>{menteeData.email}</p>
          {menteeData.realtorProfile && (
            <div className='text-sm text-muted-foreground'>
              {menteeData.realtorProfile.companyName && <div>Company: {menteeData.realtorProfile.companyName}</div>}
              {menteeData.realtorProfile.licenseNumber && <div>License: {menteeData.realtorProfile.licenseNumber}</div>}
              {menteeData.realtorProfile.phoneNumber && <div>Phone: {menteeData.realtorProfile.phoneNumber}</div>}
            </div>
          )}
        </div>
      </div>
      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Goals</CardTitle>
            </CardHeader>
            <CardContent>
              {menteeData.goals && menteeData.goals.length > 0 ? (
                menteeData.goals.map(goal => (
                  <div key={goal.id} className='mb-2'>
                    <div className='font-medium'>{goal.content}</div>
                    <div className='text-sm text-muted-foreground'>Status: {goal.status}</div>
                  </div>
                ))
              ) : (
                <p>No goals set yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
            </CardHeader>
            <CardContent>
              {menteeData.sessions && menteeData.sessions.length > 0 ? (
                menteeData.sessions.map(session => (
                  <div key={session.id} className='mb-4 p-4 border rounded-lg'>
                    <div className='font-medium flex justify-between items-center'>
                      <div>
                        {new Date(session.createdAt).toLocaleDateString()}
                        <span className='ml-1 text-sm text-muted-foreground'>
                          {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                        <span className='ml-2 text-muted-foreground'>
                          ({session.durationMinutes} minutes)
                        </span>
                      </div>
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-sm',
                        {
                          'bg-green-100 text-green-800': session.status === 'completed',
                          'bg-yellow-100 text-yellow-800': session.status === 'scheduled',
                          'bg-red-100 text-red-800': session.status === 'cancelled' || session.status === 'no_show'
                        }
                      )}>
                        {session.status}
                      </span>
                    </div>
                    {session.notes && session.notes.length > 0 && (
                      <div className='mt-2 space-y-2'>
                        {session.notes.map(note => {
                          const isExpanded = expandedNotes[note.id]
                          const noteContent = note.content
                          const isLongNote = noteContent.length > 150

                          return (
                            <div key={note.id} className='pl-4 border-l-2 border-gray-200 py-2'>
                              <div className='flex items-start justify-between gap-2'>
                                <div className='flex-1'>
                                  <div className='text-sm text-muted-foreground mb-1'>
                                    {new Date(note.createdAt).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit', 
                                      hour12: true 
                                    })}
                                  </div>
                                  <div className='text-sm'>
                                    {isLongNote && !isExpanded ? (
                                      `${noteContent.slice(0, 150)}...`
                                    ) : (
                                      noteContent
                                    )}
                                  </div>
                                </div>
                                <div className='flex gap-1'>
                                  {isLongNote && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => setExpandedNotes(prev => ({
                                        ...prev,
                                        [note.id]: !prev[note.id]
                                      }))}
                                    >
                                      {isExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleNoteClick(note, session.id)}
                                  >
                                    <Maximize2 className='h-4 w-4' />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No sessions recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a new note..."
                />
                <Button onClick={addNote}>Add</Button>
              </div>
              {menteeData.notes && menteeData.notes.length > 0 ? (
                menteeData.notes.map(note => (
                  <div key={note.id} className='mb-2'>
                    <div className='font-medium'>{new Date(note.createdAt).toLocaleDateString()}</div>
                    <div className='text-sm'>{note.content}</div>
                  </div>
                ))
              ) : (
                <p>No notes added yet.</p>
              )}
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

