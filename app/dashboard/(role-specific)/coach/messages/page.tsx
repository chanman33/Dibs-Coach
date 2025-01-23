"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Placeholder data for conversations
const PLACEHOLDER_CONVERSATIONS = [
  {
    id: 1,
    mentee: {
      id: 1,
      name: "John Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mentee1",
      status: "online",
      type: "Active Client",
      lastActive: "2024-03-20T10:02:00Z",
    },
    lastMessage: {
      content: "I wanted to discuss my recent listing strategy",
      timestamp: "2024-03-20T10:02:00Z",
      unread: true,
    },
  },
  {
    id: 2,
    mentee: {
      id: 2,
      name: "Alice Brown",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mentee2",
      status: "offline",
      type: "New Lead",
      lastActive: "2024-03-19T15:30:00Z",
    },
    lastMessage: {
      content: "Thanks for accepting my coaching request",
      timestamp: "2024-03-19T15:30:00Z",
      unread: false,
    },
  },
  {
    id: 3,
    mentee: {
      id: 3,
      name: "David Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mentee3",
      status: "online",
      type: "Active Client",
      lastActive: "2024-03-18T09:15:00Z",
    },
    lastMessage: {
      content: "Can we schedule our next coaching session?",
      timestamp: "2024-03-18T09:15:00Z",
      unread: false,
    },
  },
];

// Placeholder messages for the current conversation
const PLACEHOLDER_MESSAGES = [
  {
    id: 1,
    content: "I wanted to discuss my recent listing strategy",
    sender: "mentee",
    timestamp: "2024-03-20T10:00:00Z",
  },
  {
    id: 2,
    content: "Of course! I'd be happy to help. What specific challenges are you facing with your current listings?",
    sender: "coach",
    timestamp: "2024-03-20T10:01:00Z",
  },
  {
    id: 3,
    content: "I'm having trouble pricing properties in the current market",
    sender: "mentee",
    timestamp: "2024-03-20T10:02:00Z",
  },
];

const MENTEE_TYPES = ["All", "Active Client", "New Lead", "Past Client"];

export default function MessagesPage() {
  const [conversations, setConversations] = useState(PLACEHOLDER_CONVERSATIONS);
  const [activeConversation, setActiveConversation] = useState(conversations[0]);
  const [messages, setMessages] = useState(PLACEHOLDER_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["All"]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      content: newMessage,
      sender: "coach",
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTypeToggle = (type: string) => {
    if (type === "All") {
      setSelectedTypes(["All"]);
    } else {
      const newTypes = selectedTypes.filter((t) => t !== "All");
      if (newTypes.includes(type)) {
        setSelectedTypes(newTypes.filter((t) => t !== type));
      } else {
        setSelectedTypes([...newTypes, type]);
      }
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const nameMatch = conv.mentee.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const typeMatch =
      selectedTypes.includes("All") || selectedTypes.includes(conv.mentee.type);
    return nameMatch && typeMatch;
  });

  const handleShareAvailability = () => {
    // This will be implemented to send a scheduling link/prompt
    const message = {
      id: messages.length + 1,
      content: "Here's my availability for coaching sessions. You can book a paid session at a time that works best for you: [Calendly Link]",
      sender: "coach",
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 space-y-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mentees..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                  activeConversation.id === conversation.id ? "bg-muted" : ""
                }`}
                onClick={() => setActiveConversation(conversation)}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <img
                      src={conversation.mentee.avatar}
                      alt={conversation.mentee.name}
                    />
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                      conversation.mentee.status === "online"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{conversation.mentee.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {conversation.mentee.type}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        conversation.lastMessage.timestamp
                      ).toLocaleDateString()}
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
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <img
                src={activeConversation.mentee.avatar}
                alt={activeConversation.mentee.name}
              />
            </Avatar>
            <div>
              <h2 className="font-semibold">{activeConversation.mentee.name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeConversation.mentee.status === "online"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                  {activeConversation.mentee.status}
                </span>
                <span>{activeConversation.mentee.type}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View Profile
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleShareAvailability}
              className="flex items-center gap-2"
            >
              Share Availability
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
                    message.sender === "coach" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === "coach"
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
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
