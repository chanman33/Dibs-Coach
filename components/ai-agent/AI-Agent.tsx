"use client";

import { useState, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ChatSidebar from "./ChatSidebar";
import { createAIThread, saveAIChatMessages, getAIChatMessages } from "@/utils/actions/ai-chat-actions";

interface AIMessage {
  id?: number;
  threadId?: number;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  tokens?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AIAgentChatProps {
  userId: string;
  userDbId: number;
  threadCategory?: 'GENERAL' | 'PROPERTY' | 'CLIENT' | 'TRANSACTION' | 'MARKET_ANALYSIS' | 'DOCUMENT';
  className?: string;
}

const AIAgentChat = ({
  userId,
  userDbId,
  threadCategory = 'GENERAL',
  className,
}: AIAgentChatProps) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentThread, setCurrentThread] = useState<number | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');

    try {
      // If no current thread, create one
      if (!currentThread) {
        const result = await createAIThread({
          userDbId,
          title: userMessage.content.slice(0, 50) + "...",
          category: threadCategory,
          initialMessage: userMessage.content
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setCurrentThread(result.threadId);
      }

      // Get streaming response from API
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userDbId,
          category: threadCategory,
          message: userMessage.content,
          threadId: currentThread
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'An unexpected error occurred');
      }

      if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No reader available');

        let streamedContent = '';
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(5);
              if (data.trim() === '[DONE]') {
                // Stream completed, save both messages
                await saveAIChatMessages({
                  threadId: currentThread!,
                  messages: [
                    userMessage,
                    {
                      role: 'assistant',
                      content: streamedContent
                    }
                  ]
                });
                
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: streamedContent
                }]);
                break;
              }
              
              try {
                if (data.trim()) { // Only parse if there's actual content
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    streamedContent += parsed.content;
                    setStreamingMessage(streamedContent);
                  }
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
                // Continue processing other chunks even if one fails
                continue;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support if the issue persists.`
      }]);
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const handleThreadSelect = async (threadId: number) => {
    try {
      setCurrentThread(threadId);
      setMessages([]);
      setIsLoading(true);

      console.log('Loading messages for thread:', threadId);
      const result = await getAIChatMessages(threadId);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('Loaded messages:', result.data);
      setMessages(result.data as AIMessage[]);
    } catch (error) {
      console.error('Error fetching thread messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex h-[600px] w-full", className)}>
      <ChatSidebar
        userId={userId}
        userDbId={userDbId}
        currentThreadId={currentThread}
        onThreadSelect={handleThreadSelect}
      />
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 flex flex-col">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 break-words whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                    "max-w-[85%] min-w-[50px]"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {streamingMessage && (
              <div className="flex flex-col items-start">
                <div className="rounded-lg px-4 py-2 bg-muted break-words whitespace-pre-wrap max-w-[85%] min-w-[50px]">
                  {streamingMessage}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t p-4"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AIAgentChat;