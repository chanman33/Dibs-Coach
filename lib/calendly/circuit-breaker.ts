interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
}

export class CircuitBreaker {
  private failures: number = 0
  private lastFailureTime: number | null = null
  private readonly failureThreshold: number
  private readonly resetTimeout: number

  constructor(config: CircuitBreakerConfig) {
    this.failureThreshold = config.failureThreshold
    this.resetTimeout = config.resetTimeout
  }

  public isOpen(): boolean {
    if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.resetTimeout) {
      this.reset()
      return false
    }
    return this.failures >= this.failureThreshold
  }

  public recordSuccess(): void {
    this.reset()
  }

  public recordFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
  }

  private reset(): void {
    this.failures = 0
    this.lastFailureTime = null
  }
} 