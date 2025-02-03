'use client'

import { useState } from "react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Search, Filter, Calendar } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Types
interface BaseUser {
  id: number
  name: string
  avatar: string
  status: 'online' | 'offline'
}

interface Coach extends BaseUser {
  role: 'coach'
}

interface Mentee extends BaseUser {
  role: 'mentee'
  type: 'Active Client' | 'New Lead' | 'Past Client'
  lastActive: string
}

interface Message {
  id: number
  content: string
  sender: 'coach' | 'mentee'
  timestamp: string
}

interface Conversation {
  id: number
  participant: Coach | Mentee
  lastMessage: {
    content: string
    timestamp: string
    unread: boolean
  }
}

interface MessagesDashboardProps {
  userRole: 'coach' | 'realtor'
  userDbId: number
}

const MENTEE_TYPES = ["All", "Active Client", "New Lead", "Past Client"]

export function MessagesDashboard({ userRole, userDbId }: MessagesDashboardProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["All"])
  const [isLoading, setIsLoading] = useState(true)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: messages.length + 1,
      content: newMessage,
      sender: userRole === 'coach' ? 'coach' : 'mentee',
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTypeToggle = (type: string) => {
    if (type === "All") {
      setSelectedTypes(["All"])
    } else {
      const newTypes = selectedTypes.filter((t) => t !== "All")
      if (newTypes.includes(type)) {
        setSelectedTypes(newTypes.filter((t) => t !== type))
      } else {
        setSelectedTypes([...newTypes, type])
      }
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const nameMatch = conv.participant.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    
    if (userRole === 'coach') {
      const mentee = conv.participant as Mentee
      const typeMatch =
        selectedTypes.includes("All") || selectedTypes.includes(mentee.type)
      return nameMatch && typeMatch
    }
    
    return nameMatch
  })

  const handleSchedule = () => {
    // This will be implemented to handle scheduling
    const message: Message = {
      id: messages.length + 1,
      content: userRole === 'coach' 
        ? "Here's my availability for coaching sessions. You can book a paid session at a time that works best for you: [Calendly Link]"
        : "I'd like to schedule a coaching session at your convenience.",
      sender: userRole === 'coach' ? 'coach' : 'mentee',
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, message])
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 space-y-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${userRole === 'coach' ? 'mentees' : 'coaches'}...`}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {userRole === 'coach' && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex gap-2">
                    <Filter className="h-4 w-4" />
                    Filter by type
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {MENTEE_TYPES.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => handleTypeToggle(type)}
                    >
                      {type}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                  activeConversation?.id === conversation.id ? "bg-muted" : ""
                }`}
                onClick={() => setActiveConversation(conversation)}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <img
                      src={conversation.participant.avatar}
                      alt={conversation.participant.name}
                    />
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                      conversation.participant.status === "online"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{conversation.participant.name}</p>
                      {'type' in conversation.participant && (
                        <p className="text-xs text-muted-foreground">
                          {conversation.participant.type}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage.content}
                    </p>
                    {conversation.lastMessage.unread && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col">
          <div className="border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <img
                  src={activeConversation.participant.avatar}
                  alt={activeConversation.participant.name}
                />
              </Avatar>
              <div>
                <h2 className="font-semibold">{activeConversation.participant.name}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeConversation.participant.status === "online"
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {activeConversation.participant.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                View Profile
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="flex items-center gap-2"
                onClick={handleSchedule}
              >
                <Calendar className="h-4 w-4" />
                Schedule Session
              </Button>
            </div>
          </div>

          <Card className="flex-1 m-4 border rounded-lg">
            <ScrollArea className="h-[calc(100vh-12rem)] p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === (userRole === 'coach' ? 'coach' : 'mentee') 
                        ? "justify-end" 
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === (userRole === 'coach' ? 'coach' : 'mentee')
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a conversation to start messaging
        </div>
      )}
    </div>
  )
} 