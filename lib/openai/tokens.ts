// Helper function to count tokens (approximate)
export function countTokens(text: string): number {
  // GPT models use ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

// Helper to check if a message will fit within token limits
export function willMessageFitTokenLimit(
  text: string,
  maxTokens: number = 4096,
  reservedTokens: number = 100 // Reserve tokens for system messages etc.
): boolean {
  const estimatedTokens = countTokens(text);
  return estimatedTokens <= (maxTokens - reservedTokens);
}

// Helper to truncate text to fit within token limits
export function truncateToTokenLimit(
  text: string,
  maxTokens: number = 4096,
  reservedTokens: number = 100
): string {
  const targetTokens = maxTokens - reservedTokens;
  const currentTokens = countTokens(text);
  
  if (currentTokens <= targetTokens) {
    return text;
  }
  
  // Approximate character limit (4 chars per token)
  const targetLength = Math.floor(targetTokens * 4);
  return text.slice(0, targetLength) + "...";
} 