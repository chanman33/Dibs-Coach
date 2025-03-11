import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "@/utils/auth";
import { z } from "zod";

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

// Query parameters validation
const querySchema = z.object({
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
  category: z.enum(['GENERAL', 'PROPERTY', 'CLIENT', 'TRANSACTION', 'MARKET_ANALYSIS', 'DOCUMENT']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const runtime = 'edge';
export const preferredRegion = 'cle1';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const result = querySchema.safeParse(Object.fromEntries(searchParams));
    
    if (!result.success) {
      return new NextResponse("Invalid query parameters", { status: 400 });
    }

    const { status, category, page, limit } = result.data;
    const offset = (page - 1) * limit;

    const supabase = createAuthClient();

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("userId", session.userId)
      .single();

    if (userError || !user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // First get threads
    let query = supabase
      .from("AIThread")
      .select("*", { count: 'exact' })
      .eq("userDbId", user.id)
      .order("updatedAt", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (category) {
      query = query.eq("category", category);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: threads, count, error: threadsError } = await query;

    if (threadsError) throw threadsError;

    // Get last messages for these threads
    const threadIds = threads?.map(thread => thread.id) || [];
    
    const { data: lastMessages } = await supabase
      .from("AIMessage")
      .select("*")
      .in("threadId", threadIds)
      .order("createdAt", { ascending: false });

    // Group messages by threadId to get the last message for each thread
    const lastMessageByThread = lastMessages?.reduce((acc, msg) => {
      if (!acc[msg.threadId] || new Date(msg.createdAt) > new Date(acc[msg.threadId].createdAt)) {
        acc[msg.threadId] = msg;
      }
      return acc;
    }, {} as Record<number, any>) || {};

    // Combine threads with their last messages
    const processedThreads = (threads || []).map(thread => ({
      id: thread.id,
      title: thread.title,
      category: thread.category,
      status: thread.status,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      lastMessage: lastMessageByThread[thread.id] || null
    }));

    return new NextResponse(
      JSON.stringify({
        threads: processedThreads,
        total: count || 0,
        page,
        limit,
      }),
      { 
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        }
      }
    );

  } catch (error) {
    console.error("[THREAD_ERROR]", error);
    return new NextResponse(
      "Internal Server Error", 
      { status: 500 }
    );
  }
} 