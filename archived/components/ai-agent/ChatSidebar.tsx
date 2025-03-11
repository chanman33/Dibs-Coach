"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getAIChatThreads } from "@/utils/actions/ai-chat-actions";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatThread {
  ulid: string;
  title: string;
  category: string;
  status: string;
  lastMessage?: {
    content: string;
    createdAt: string;
  } | null;
}

interface ChatSidebarProps {
  userId: string;
  userUlid: string;
  currentThreadUlid: string | null;
  onThreadSelect: (threadUlid: string) => void;
  onNewThread: () => void;
}

export default function ChatSidebar({
  userId,
  userUlid,
  currentThreadUlid,
  onThreadSelect,
  onNewThread,
}: ChatSidebarProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const result = await getAIChatThreads({
          userUlid,
          status: 'ACTIVE'
        });

        if (result.success && result.data) {
          setThreads(result.data);
        }
      } catch (error) {
        console.error('Error loading threads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThreads();
  }, [userUlid]);

  if (isLoading) {
    return (
      <Card className="w-80 p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </Card>
    );
  }

  return (
    <Card className="w-80 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold">Chat History</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNewThread}
          className="h-8 px-2"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-2">New Thread</span>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {threads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">
              No chat history yet
            </p>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.ulid}
                onClick={() => onThreadSelect(thread.ulid)}
                className={cn(
                  "w-full text-left p-3 rounded-lg hover:bg-muted transition-colors",
                  currentThreadUlid === thread.ulid && "bg-muted"
                )}
              >
                <div className="space-y-1">
                  <h3 className="font-medium text-sm line-clamp-1">
                    {thread.title}
                  </h3>
                  {thread.lastMessage && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {thread.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
} 