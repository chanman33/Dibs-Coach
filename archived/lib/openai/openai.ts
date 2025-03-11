import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 20 * 1000, // 20 seconds
});

// Helper function to count tokens (approximate)
export function countTokens(text: string): number {
  // GPT models use ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

// Rate limiting helper
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 50;

const requestTimestamps: number[] = [];

export function checkRateLimit(): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_DURATION;
  
  // Remove timestamps outside the current window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift();
  }
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  requestTimestamps.push(now);
  return true;
}

// Image processing utilities
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function processImageWithAI(
  file: File | null,
  description: string,
  options?: {
    maxTokens?: number;
    model?: string;
  }
): Promise<string | null> {
  if (!file) return null;
  
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit`);
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: options?.model || "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "You are a professional real estate photographer and property analyst. Describe the key visual elements and notable features of the property image in a concise, professional manner."
        },
        {
          role: "user",
          content: [
            { type: "text", text: description },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: options?.maxTokens || 150,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error(`[IMAGE_PROCESSING_ERROR]`, error);
    return null;
  }
}

// Retry utility for OpenAI calls
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number;
    delayMs?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { retries = 3, delayMs = 1000, onError } = options;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error, attempt);
      }
      
      if (attempt === retries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw new Error("Retry operation failed");
} 