export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  onError?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    delayMs = 1000,
    onError,
    shouldRetry = (error) => {
      // By default, retry on rate limits and temporary server errors
      const message = error.message.toLowerCase();
      return message.includes('rate_limit') || 
             message.includes('timeout') ||
             message.includes('server_error') ||
             message.includes('internal_error');
    }
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      lastError = error;
      
      if (onError) {
        onError(error, attempt);
      }
      
      if (attempt === retries || !shouldRetry(error)) {
        throw error;
      }
      
      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen due to the throw in the catch block,
  // but TypeScript needs it
  throw lastError || new Error("Retry operation failed");
}

// Helper for common OpenAI operations
export async function withOpenAIRetry<T>(
  operation: () => Promise<T>,
  customOptions?: Partial<RetryOptions>
): Promise<T> {
  return withRetry(operation, {
    retries: 3,
    delayMs: 1000,
    onError: (error, attempt) => {
      console.error(`[OPENAI_ERROR] Attempt ${attempt}:`, error);
    },
    ...customOptions
  });
} 