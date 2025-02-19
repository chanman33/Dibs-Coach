"use server";

import { createAuthClient } from "@/utils/auth";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { generateUlid } from "@/utils/ulid";
import { NextResponse } from "next/server";

/**
 * Types for AI Chat functionality
 */
interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  tokens?: number;
}

interface AIThreadOptions {
  userUlid: string;
  title: string;
  category: 'GENERAL' | 'PROPERTY' | 'CLIENT' | 'TRANSACTION' | 'MARKET_ANALYSIS' | 'DOCUMENT';
  initialMessage: string;
}

interface AIThreadFilters {
  userUlid: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Creates a new AI chat thread with an initial message
 */
export async function createAIThread({
  userUlid,
  title,
  category,
  initialMessage,
}: AIThreadOptions) {
  try {
    const session = await auth();
    if (!session?.userId) throw new Error("Unauthorized");

    const supabase = createAuthClient();
    const now = new Date().toISOString();
    const threadUlid = generateUlid();

    // Create thread
    const { data: thread, error: threadError } = await supabase
      .from("AIThread")
      .insert({
        ulid: threadUlid,
        userUlid,
        title,
        category,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      })
      .select("ulid")
      .single();

    if (threadError) throw threadError;
    if (!thread?.ulid) throw new Error("Failed to create thread");

    // Save initial message
    const { error: messageError } = await supabase
      .from("AIMessage")
      .insert({
        ulid: generateUlid(),
        threadUlid: thread.ulid,
        role: "user",
        content: initialMessage,
        model: "gpt-4",
        createdAt: now,
        updatedAt: now,
      });

    if (messageError) throw messageError;

    revalidatePath("/dashboard/ai-agent");
    return { success: true, threadUlid: thread.ulid };
  } catch (error) {
    console.error("[CREATE_AI_THREAD_ERROR]", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create AI thread" 
    };
  }
}

/**
 * Saves multiple AI chat messages to a thread
 */
export async function saveAIChatMessages({
  threadUlid,
  messages,
}: {
  threadUlid: string;
  messages: AIChatMessage[];
}) {
  try {
    const session = await auth();
    if (!session?.userId) throw new Error("Unauthorized");

    const supabase = createAuthClient();
    const now = new Date().toISOString();

    // Insert all messages
    const { error: messagesError } = await supabase
      .from("AIMessage")
      .insert(
        messages.map(msg => ({
          ulid: generateUlid(),
          threadUlid,
          role: msg.role,
          content: msg.content,
          model: msg.model || "gpt-4",
          tokens: msg.tokens || 0,
          createdAt: now,
          updatedAt: now,
        }))
      );

    if (messagesError) throw messagesError;

    // Update thread's updatedAt
    const { error: updateError } = await supabase
      .from("AIThread")
      .update({ updatedAt: now })
      .eq("ulid", threadUlid);

    if (updateError) {
      console.error("[UPDATE_AI_THREAD_ERROR]", updateError);
    }

    revalidatePath("/dashboard/ai-agent");
    return { success: true };
  } catch (error) {
    console.error("[SAVE_AI_MESSAGES_ERROR]", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save AI messages" 
    };
  }
}

/**
 * Retrieves all messages from an AI chat thread
 */
export async function getAIChatMessages(threadUlid: string) {
  try {
    const session = await auth();
    if (!session?.userId) throw new Error("Unauthorized");

    const supabase = createAuthClient();

    const { data, error } = await supabase
      .from("AIMessage")
      .select("*")
      .eq("threadUlid", threadUlid)
      .order("createdAt", { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("[GET_AI_MESSAGES_ERROR]", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch AI messages" 
    };
  }
}

/**
 * Retrieves AI chat threads with optional filtering and pagination
 */
export async function getAIChatThreads({
  userUlid,
  category,
  status,
  page = 1,
  limit = 20,
}: AIThreadFilters) {
  try {
    const session = await auth();
    if (!session?.userId) throw new Error("Unauthorized");

    const supabase = createAuthClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("AIThread")
      .select(`
        *,
        messages:AIMessage(
          role,
          content,
          createdAt
        )
      `, { count: 'exact' })
      .eq("userUlid", userUlid)
      .order("updatedAt", { ascending: false });

    if (category && category !== 'ALL') {
      query = query.eq("category", category);
    }
    if (status && status !== 'ALL') {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Process the data to get the last message for each thread
    const processedThreads = data?.map(thread => ({
      ...thread,
      lastMessage: thread.messages?.length > 0
        ? thread.messages.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
        : null,
      messages: undefined // Remove the messages array
    }));

    return { success: true, data: processedThreads, count };
  } catch (error) {
    console.error("[GET_AI_THREADS_ERROR]", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch AI threads" 
    };
  }
}

export async function saveUserMessage(currentThreadId: string, message: string) {
  try {
    const session = await auth();
    if (!session?.userId) throw new Error("Unauthorized");

    const supabase = createAuthClient();
    const now = new Date().toISOString();

    const { error: messageError } = await supabase
      .from("AIMessage")
      .insert({
        ulid: generateUlid(),
        threadUlid: currentThreadId,
        role: "user",
        content: message,
        model: "gpt-4",
        updatedAt: now,
        createdAt: now,
      });

    if (messageError) {
      console.error("[MESSAGE_ERROR]", messageError);
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to save user message", 
          details: messageError.message 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[USER_MESSAGE_SAVED]", {
      threadUlid: currentThreadId,
      timestamp: now
    });

    // Get thread context (last few messages)
    const { data: threadMessages, error: contextError } = await supabase
      .from("AIMessage")
      .select("role, content")
      .eq("threadUlid", currentThreadId)
      .order("createdAt", { ascending: false })
      .limit(10);

    if (contextError) throw contextError;

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        data: {
          threadUlid: currentThreadId,
          messages: threadMessages
        }
      }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SAVE_USER_MESSAGE_ERROR]", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to save user message", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 