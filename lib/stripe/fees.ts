/**
 * Fee calculation service for the coaching marketplace
 */

export interface FeeCalculation {
  totalAmount: number;
  coachFeeAmount: number;
  agentFeeAmount: number;
  totalPlatformFee: number;
  coachPayout: number;
  stripeFee: number;
}

export interface FeeConfig {
  coachFeePercentage: number;
  agentFeePercentage: number;
  stripePercentage: number;
  stripeFixedFee: number;
}

// Default fee configuration
export const DEFAULT_FEE_CONFIG: FeeConfig = {
  coachFeePercentage: 8.5, // 8.5% fee from coach
  agentFeePercentage: 3.5, // 3.5% fee from agent
  stripePercentage: 2.9, // Stripe's percentage fee
  stripeFixedFee: 0.30, // Stripe's fixed fee in dollars
};

export class FeeCalculator {
  private config: FeeConfig;

  constructor(config: Partial<FeeConfig> = {}) {
    this.config = {
      ...DEFAULT_FEE_CONFIG,
      ...config,
    };
  }

  /**
   * Calculate all fees for a given session amount
   */
  calculateFees(amount: number): FeeCalculation {
    // Calculate platform fees
    const coachFeeAmount = this.roundToTwoDecimals(amount * (this.config.coachFeePercentage / 100));
    const agentFeeAmount = this.roundToTwoDecimals(amount * (this.config.agentFeePercentage / 100));
    const totalPlatformFee = this.roundToTwoDecimals(coachFeeAmount + agentFeeAmount);

    // Calculate Stripe's fee
    const stripeFee = this.calculateStripeFee(amount);

    // Calculate final payout to coach
    const coachPayout = this.roundToTwoDecimals(amount - coachFeeAmount);

    return {
      totalAmount: amount,
      coachFeeAmount,
      agentFeeAmount,
      totalPlatformFee,
      coachPayout,
      stripeFee,
    };
  }

  /**
   * Calculate the amount we need to charge to achieve a desired coach payout
   */
  calculateAmountFromDesiredPayout(desiredCoachPayout: number): FeeCalculation {
    // Work backwards to find the total amount needed
    const coachFeeMultiplier = 1 / (1 - (this.config.coachFeePercentage / 100));
    const totalAmount = this.roundToTwoDecimals(desiredCoachPayout * coachFeeMultiplier);

    return this.calculateFees(totalAmount);
  }

  /**
   * Calculate Stripe's fee for a given amount
   */
  private calculateStripeFee(amount: number): number {
    const percentageFee = amount * (this.config.stripePercentage / 100);
    return this.roundToTwoDecimals(percentageFee + this.config.stripeFixedFee);
  }

  /**
   * Round to 2 decimal places
   */
  private roundToTwoDecimals(num: number): number {
    return Math.round(num * 100) / 100;
  }

  /**
   * Get fee breakdown explanation
   */
  getFeeBreakdown(amount: number): string[] {
    const fees = this.calculateFees(amount);
    return [
      `Session Amount: $${fees.totalAmount.toFixed(2)}`,
      `Coach Fee (${this.config.coachFeePercentage}%): $${fees.coachFeeAmount.toFixed(2)}`,
      `Agent Fee (${this.config.agentFeePercentage}%): $${fees.agentFeeAmount.toFixed(2)}`,
      `Platform Fee Total: $${fees.totalPlatformFee.toFixed(2)}`,
      `Stripe Processing: $${fees.stripeFee.toFixed(2)}`,
      `Coach Payout: $${fees.coachPayout.toFixed(2)}`,
    ];
  }
}

// Export singleton instance with default config
export const feeCalculator = new FeeCalculator(); 