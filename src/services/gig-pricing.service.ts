/**
 * GIG PRICING SERVICE
 * 
 * Orchestrates pricing calculations for gig-related transactions.
 * Demonstrates the hybrid procedural/OOP approach by coordinating
 * procedural calculation functions through service composition.
 * 
 * ARCHITECTURAL ROLE: OOP service layer that organizes pricing procedures
 * DEPENDENCIES: Pricing calculation functions, validation utilities
 * STATE MANAGEMENT: Stateless service with injected dependencies
 * 
 * @example
 * ```typescript
 * const pricingService = new GigPricingService();
 * const quote = await pricingService.generateQuote(gigDetails);
 * ```
 * 
 * @author Gigsy Engineering Team
 * @version 1.0.0
 * @since 2025-01-01
 */

import {
  calculateTotalPrice,
  calculateDiscount,
  type Fee,
  type DiscountRule
} from '../lib/pricing';

export interface GigDetails {
  readonly scope: string;
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  readonly estimatedHours: number;
  readonly clientTier: 'standard' | 'premium' | 'enterprise';
  readonly location: string;
}

export interface PriceQuote {
  readonly basePrice: number;
  readonly discount: number;
  readonly tax: number;
  readonly fees: Fee[];
  readonly total: number;
  readonly gigDetails: GigDetails;
  readonly generatedAt: Date;
}

export interface PricingConfiguration {
  readonly hourlyRates: Record<GigDetails['difficulty'], number>;
  readonly discountRules: Record<GigDetails['clientTier'], DiscountRule>;
  readonly taxRate: number;
  readonly standardFees: Fee[];
}

/**
 * Default pricing configuration for the Gigsy platform
 */
const DEFAULT_PRICING_CONFIG: PricingConfiguration = {
  hourlyRates: {
    beginner: 25,
    intermediate: 50,
    advanced: 85,
    expert: 150
  },
  discountRules: {
    standard: { threshold: 0, percentage: 0 },
    premium: { threshold: 500, percentage: 0.05 },
    enterprise: { threshold: 1000, percentage: 0.1 }
  },
  taxRate: 0.08,
  standardFees: [
    { name: 'platform_fee', amount: 10 },
    { name: 'processing_fee', amount: 5 }
  ]
};

export class GigPricingService {
  constructor(
    private readonly config: PricingConfiguration = DEFAULT_PRICING_CONFIG
  ) {}

  /**
   * Generates a complete pricing quote for a gig
   * 
   * PROCEDURAL FLOW:
   * 1. Calculate base price using hourly rate and estimated hours
   * 2. Determine applicable discount based on client tier
   * 3. Calculate final total with tax and fees
   * 4. Build structured quote object
   * 
   * @param gigDetails - Gig specifications and requirements
   * @returns Complete pricing quote with breakdown
   * @throws {Error} When gig details are invalid
   * 
   * @example
   * ```typescript
   * const quote = await service.generateQuote({
   *   scope: "Build e-commerce website",
   *   difficulty: "advanced",
   *   estimatedHours: 40,
   *   clientTier: "premium",
   *   location: "Remote"
   * });
   * ```
   */
  async generateQuote(gigDetails: GigDetails): Promise<PriceQuote> {
    // Step 1: Validate inputs (procedural)
    this.validateGigDetails(gigDetails);

    // Step 2: Calculate base price (procedural)
    const basePrice = this.calculateBasePrice(gigDetails);

    // Step 3: Calculate applicable discount (procedural)
    const discountRule = this.config.discountRules[gigDetails.clientTier];
    const discount = calculateDiscount(basePrice, discountRule);

    // Step 4: Calculate final total (procedural coordination)
    const total = calculateTotalPrice(
      basePrice,
      this.config.taxRate,
      this.config.standardFees,
      discount
    );

    // Step 5: Build quote object (OOP coordination)
    return this.buildQuote(gigDetails, basePrice, discount, total);
  }

  /**
   * Calculates base price for a gig based on difficulty and estimated hours
   * @param gigDetails - Gig specifications
   * @returns Base price before discounts, tax, and fees
   */
  private calculateBasePrice(gigDetails: GigDetails): number {
    const hourlyRate = this.config.hourlyRates[gigDetails.difficulty];
    return hourlyRate * gigDetails.estimatedHours;
  }

  /**
   * Validates gig details for pricing calculation
   * @param gigDetails - Gig details to validate
   * @throws {Error} When validation fails
   */
  private validateGigDetails(gigDetails: GigDetails): void {
    if (!gigDetails.scope || gigDetails.scope.trim().length === 0) {
      throw new Error("Gig scope is required");
    }

    if (gigDetails.estimatedHours <= 0) {
      throw new Error("Estimated hours must be positive");
    }

    if (gigDetails.estimatedHours > 2000) {
      throw new Error("Estimated hours cannot exceed 2000 for a single gig");
    }

    if (!this.config.hourlyRates[gigDetails.difficulty]) {
      throw new Error(`Invalid difficulty level: ${gigDetails.difficulty}`);
    }

    if (!this.config.discountRules[gigDetails.clientTier]) {
      throw new Error(`Invalid client tier: ${gigDetails.clientTier}`);
    }
  }

  /**
   * Builds a complete quote object with all pricing details
   * @param gigDetails - Original gig specifications
   * @param basePrice - Calculated base price
   * @param discount - Applied discount amount
   * @param total - Final calculated total
   * @returns Structured quote object
   */
  private buildQuote(
    gigDetails: GigDetails,
    basePrice: number,
    discount: number,
    total: number
  ): PriceQuote {
    const discountedPrice = Math.max(0, basePrice - discount);
    const tax = discountedPrice * this.config.taxRate;
    
    return {
      basePrice,
      discount,
      tax,
      fees: [...this.config.standardFees],
      total,
      gigDetails,
      generatedAt: new Date()
    };
  }

  /**
   * Gets current pricing configuration
   * @returns Current pricing configuration
   */
  getPricingConfiguration(): Readonly<PricingConfiguration> {
    return Object.freeze({ ...this.config });
  }
}