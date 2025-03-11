import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAuthClient } from "@/utils/auth";
import { 
  openai, 
  checkRateLimit, 
  withOpenAIRetry,
  checkUserTierRateLimit 
} from "@/lib/openai";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Query parameters validation for GET request
const getQuerySchema = z.object({
  threadId: z.coerce.number(),
});

// Request body validation for POST request
const postBodySchema = z.object({
  threadUlid: z.string().nullish(), // allows both null and undefined
  userId: z.string(),
  userUlid: z.string(),
  category: z.enum(['GENERAL', 'PROPERTY', 'CLIENT', 'TRANSACTION', 'MARKET_ANALYSIS', 'DOCUMENT']),
  message: z.string().min(1),
});

// ULID generator for Edge Runtime
function generateEdgeUlid() {
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const timestamp = Date.now();
  const randomValues = new Uint8Array(10);
  crypto.getRandomValues(randomValues);
  
  // Convert timestamp to Crockford's Base32
  let id = '';
  let tsLeft = timestamp;
  for (let i = 9; i >= 0; i--) {
    id = ENCODING[tsLeft % 32] + id;
    tsLeft = Math.floor(tsLeft / 32);
  }
  
  // Convert random bytes to Crockford's Base32
  for (let i = 0; i < 16; i++) {
    const byte = randomValues[Math.floor(i / 1.6)];
    const shift = (i % 2) * 4;
    id += ENCODING[(byte >> shift) & 0x1f];
  }
  
  return id; // Returns exactly 26 characters
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const result = getQuerySchema.safeParse(Object.fromEntries(searchParams));
    
    if (!result.success) {
      return new NextResponse("Invalid query parameters", { status: 400 });
    }

    const { threadId } = result.data;
    const supabase = createAuthClient();

    // Verify thread belongs to user
    const { data: thread, error: threadError } = await supabase
      .from("AIThread")
      .select("userDbId")
      .eq("id", threadId)
      .single();

    if (threadError || !thread) {
      return new NextResponse("Thread not found", { status: 404 });
    }

    // Get user's database ID
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id")
      .eq("userId", session.userId)
      .single();

    if (userError || !user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify thread ownership
    if (thread.userDbId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get thread messages
    console.log("[GET_MESSAGES_START]", { threadId });
    
    const { data: messages, error: messagesError } = await supabase
      .from("AIMessage")
      .select("*")
      .eq("threadId", threadId)
      .order("createdAt", { ascending: true });

    if (messagesError) {
      console.error("[GET_MESSAGES_ERROR]", messagesError);
      throw messagesError;
    }

    console.log("[GET_MESSAGES_SUCCESS]", {
      threadId,
      messageCount: messages?.length || 0,
      messages: messages?.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content?.slice(0, 50) + "...",
        createdAt: m.createdAt
      }))
    });

    // Also check if messages exist in the thread
    const { data: threadCheck, error: threadCheckError } = await supabase
      .from("AIThread")
      .select("id, title, category, status, createdAt")
      .eq("id", threadId)
      .single();

    console.log("[THREAD_CHECK]", {
      thread: threadCheck,
      error: threadCheckError
    });

    return new NextResponse(
      JSON.stringify({ messages: messages || [] }),
      { 
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        }
      }
    );

  } catch (error) {
    console.error("[MESSAGE_ERROR]", error);
    return new NextResponse(
      "Internal Server Error", 
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check rate limit - using user tier if available, otherwise default
    const userTier = 'FREE'; // TODO: Get from user profile
    if (!checkUserTierRateLimit(userTier)) {
      return new NextResponse(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), 
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    let json;
    try {
      json = await req.json();
    } catch (e) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid JSON", 
          details: "The request body must be valid JSON" 
        }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = postBodySchema.safeParse(json);
    
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid request data", 
          details: result.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { threadUlid, userId, userUlid, category, message } = result.data;

    // Verify user matches
    if (session.userId !== userId) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createAuthClient();

    // Get or create thread
    let currentThreadUlid: string;
    if (threadUlid) {
      currentThreadUlid = threadUlid;
    } else {
      const now = new Date().toISOString();
      const newThreadUlid = generateEdgeUlid();
      const { data: thread, error: threadError } = await supabase
        .from("AIThread")
        .insert({
          ulid: newThreadUlid,
          userUlid,
          title: message.slice(0, 50) + "...",
          category,
          status: "ACTIVE",
          updatedAt: now,
        })
        .select("ulid")
        .single();

      if (threadError) {
        console.error("[THREAD_ERROR]", threadError);
        return new NextResponse(
          JSON.stringify({ 
            error: "Failed to create AI thread", 
            details: threadError.message 
          }), 
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!thread?.ulid) {
        return new NextResponse(
          JSON.stringify({ 
            error: "Failed to create thread", 
            details: "No thread ULID returned" 
          }), 
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      currentThreadUlid = thread.ulid;
    }

    // Insert user message
    const now = new Date().toISOString();
    console.log("[SAVING_USER_MESSAGE]", {
      threadUlid: currentThreadUlid,
      message,
      timestamp: now
    });

    const { error: messageError } = await supabase
      .from("AIMessage")
      .insert({
        ulid: generateEdgeUlid(),
        threadUlid: currentThreadUlid,
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
      threadUlid: currentThreadUlid,
      timestamp: now
    });

    // Get thread context (last few messages)
    const { data: threadMessages, error: contextError } = await supabase
      .from("AIMessage")
      .select("role, content")
      .eq("threadUlid", currentThreadUlid)
      .order("createdAt", { ascending: false })
      .limit(10);

    if (contextError) {
      console.error("[CONTEXT_ERROR]", contextError);
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to fetch message context", 
          details: contextError.message 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare messages for OpenAI
    const contextMessages = threadMessages
      ? threadMessages
          .reverse()
          .map(msg => ({ 
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content 
          }))
      : [];

    // Get OpenAI response with retry
    try {
      const stream = await withOpenAIRetry(async () => {
        return await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are RealtorGPT, an AI assistant specialized in real estate. 
                       You're currently in a ${category.toLowerCase()} conversation.
                       Provide concise, accurate, and helpful responses.
                       If you need specific property or market data, ask for it.`
            },
            ...contextMessages,
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 500,
          presence_penalty: 0.6,
          frequency_penalty: 0.5,
          top_p: 0.9,
          stream: true, // Enable streaming
        });
      });

      // Create a new TransformStream for encoding
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      let fullResponse = '';
      
      // Create a readable stream that will be sent to the client
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                fullResponse += content;
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      // Store assistant response after stream completes
      const now2 = new Date().toISOString();
      console.log("[SAVING_ASSISTANT_MESSAGE]", {
        threadUlid: currentThreadUlid,
        responseLength: fullResponse.length,
        timestamp: now2
      });

      const { error: assistantError } = await supabase
        .from("AIMessage")
        .insert({
          ulid: generateEdgeUlid(),
          threadUlid: currentThreadUlid,
          role: "assistant",
          content: fullResponse,
          model: "gpt-4",
          updatedAt: now2,
          createdAt: now2,
        });

      if (assistantError) {
        console.error("[ASSISTANT_ERROR]", assistantError);
        throw assistantError;
      }

      console.log("[ASSISTANT_MESSAGE_SAVED]", {
        threadUlid: currentThreadUlid,
        timestamp: now2
      });

      // Update thread's updatedAt
      const { error: updateError } = await supabase
        .from("AIThread")
        .update({ updatedAt: now2 })
        .eq("ulid", currentThreadUlid);

      if (updateError) {
        console.error("[UPDATE_ERROR]", updateError);
        // Non-critical error, don't throw
      }

      // Revalidate the chat thread page
      revalidatePath(`/dashboard/${category.toLowerCase()}/ai-agent`);

      // Return the stream response
      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'x-thread-id': currentThreadUlid,
        },
      });

    } catch (error) {
      console.error("[OPENAI_ERROR]", error);
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to get AI response", 
          details: error instanceof Error ? error.message : "Unknown error" 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process message";
    return new NextResponse(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
} 