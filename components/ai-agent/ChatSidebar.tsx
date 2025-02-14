"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MessageSquarePlus } from "lucide-react";

interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

interface ChatThread {
  id: number;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: ChatMessage | null;
}

interface ChatSidebarProps {
  userId: string;
  userDbId: number;
  currentThreadId: number | null;
  onThreadSelect: (threadId: number) => void;
  className?: string;
}

const THREAD_CATEGORIES = [
  'ALL',
  'GENERAL',
  'PROPERTY',
  'CLIENT',
  'TRANSACTION',
  'MARKET_ANALYSIS',
  'DOCUMENT'
] as const;

const THREAD_STATUSES = ['ALL', 'ACTIVE', 'ARCHIVED', 'DELETED'] as const;

export default function ChatSidebar({
  userId,
  userDbId,
  currentThreadId,
  onThreadSelect,
  className
}: ChatSidebarProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<typeof THREAD_CATEGORIES[number]>('ALL');
  const [status, setStatus] = useState<typeof THREAD_STATUSES[number]>('ACTIVE');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchThreads = async (reset = false) => {
    try {
      setError(null);
      const currentPage = reset ? 1 : page;
      let url = `/api/chat/thread?page=${currentPage}&limit=20`;
      
      if (category !== 'ALL') {
        url += `&category=${category}`;
      }
      if (status !== 'ALL') {
        url += `&status=${status}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch threads');
      }
      
      const data = await response.json();
      
      setThreads(prev => reset ? data.threads : [...prev, ...data.threads]);
      setHasMore(data.threads.length === 20);
      if (!reset) setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching threads:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch threads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchThreads(true);
  }, [category, status]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          Loading...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-4">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => fetchThreads(true)}>
            Try Again
          </Button>
        </div>
      );
    }

    if (threads.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-4">
          <MessageSquarePlus className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="font-semibold">No chat history yet</h3>
            <p className="text-sm text-muted-foreground">
              Start a new conversation by typing a message in the chat box
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        {threads.map((thread) => (
          <Button
            key={thread.id}
            variant={currentThreadId === thread.id ? "secondary" : "ghost"}
            className="w-full justify-start text-left h-auto py-3"
            onClick={() => onThreadSelect(thread.id)}
          >
            <div className="space-y-1">
              <div className="font-medium line-clamp-1">{thread.title}</div>
              {thread.lastMessage && (
                <>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {thread.lastMessage.content}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(thread.lastMessage.createdAt), 'MMM d, h:mm a')}
                  </div>
                </>
              )}
            </div>
          </Button>
        ))}
        
        {hasMore && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => fetchThreads()}
          >
            Load More
          </Button>
        )}
      </>
    );
  };

  return (
    <div className={cn("w-64 border-r flex flex-col h-full", className)}>
      <div className="p-4 space-y-2 border-b">
        <Select
          value={category}
          onValueChange={(value) => setCategory(value as typeof THREAD_CATEGORIES[number])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {THREAD_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as typeof THREAD_STATUSES[number])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {THREAD_STATUSES.map((stat) => (
              <SelectItem key={stat} value={stat}>
                {stat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {renderContent()}
        </div>
      </ScrollArea>
    </div>
  );
} 