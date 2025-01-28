interface RetryManagerConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

export class RetryManager {
  private readonly maxRetries: number
  private readonly baseDelay: number
  private readonly maxDelay: number

  constructor(config: RetryManagerConfig) {
    this.maxRetries = config.maxRetries
    this.baseDelay = config.baseDelay
    this.maxDelay = config.maxDelay
  }

  public shouldRetry(error: Error | null, attempt: number): boolean {
    if (attempt >= this.maxRetries) {
      return false
    }

    // Don't retry on certain errors
    if (error) {
      const errorMessage = error.message.toLowerCase()
      // Don't retry on invalid tokens or unauthorized errors
      if (
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('invalid_token') ||
        errorMessage.includes('unauthorized')
      ) {
        return false
      }
    }

    return true
  }

  public getBackoffTime(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(2, attempt)
    )
    
    // Add random jitter (±20%)
    const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1)
    return Math.floor(exponentialDelay + jitter)
  }

  public handleMaxRetries(error: Error): void {
    console.error('[RETRY_MANAGER] Max retries reached:', error)
    // Additional handling like metrics/monitoring could be added here
  }
} 