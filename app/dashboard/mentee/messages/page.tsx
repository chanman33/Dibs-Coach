"use client"

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Calendar } from "lucide-react";

// Placeholder data for conversations
const PLACEHOLDER_CONVERSATIONS = [
  {
    id: 1,
    coach: {
      id: 1,
      name: "Sarah Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=coach1",
      status: "online",
    },
    lastMessage: {
      content: "What specific aspects would you like to focus on?",
      timestamp: "2024-03-20T10:02:00Z",
      unread: true,
    },
  },
  {
    id: 2,
    coach: {
      id: 2,
      name: "Michael Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=coach2",
      status: "offline",
    },
    lastMessage: {
      content: "Great progress on your goals this month!",
      timestamp: "2024-03-19T15:30:00Z",
      unread: false,
    },
  },
  {
    id: 3,
    coach: {
      id: 3,
      name: "Emma Davis",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=coach3",
      status: "online",
    },
    lastMessage: {
      content: "Let's schedule our next coaching session",
      timestamp: "2024-03-18T09:15:00Z",
      unread: false,
    },
  },
];

// Placeholder messages for the current conversation
const PLACEHOLDER_MESSAGES = [
  {
    id: 1,
    content: "Hi there! How can I help you today?",
    sender: "coach",
    timestamp: "2024-03-20T10:00:00Z",
  },
  {
    id: 2,
    content: "I wanted to discuss my recent listing strategy",
    sender: "realtor",
    timestamp: "2024-03-20T10:01:00Z",
  },
  {
    id: 3,
    content: "Of course! What specific aspects would you like to focus on?",
    sender: "coach",
    timestamp: "2024-03-20T10:02:00Z",
  },
];

export default function MessagesPage() {
  const [conversations, setConversations] = useState(PLACEHOLDER_CONVERSATIONS);
  const [activeConversation, setActiveConversation] = useState(conversations[0]);
  const [messages, setMessages] = useState(PLACEHOLDER_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      content: newMessage,
      sender: "realtor",
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

  const filteredConversations = conversations.filter((conv) =>
    conv.coach.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                      src={conversation.coach.avatar}
                      alt={conversation.coach.name}
                    />
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                      conversation.coach.status === "online"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{conversation.coach.name}</p>
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
                src={activeConversation.coach.avatar}
                alt={activeConversation.coach.name}
              />
            </Avatar>
            <div>
              <h2 className="font-semibold">{activeConversation.coach.name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeConversation.coach.status === "online"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                  {activeConversation.coach.status}
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
                    message.sender === "realtor" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === "realtor"
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
