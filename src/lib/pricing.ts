/**
 * PRICING CALCULATION UTILITIES
 * 
 * Procedural functions for core pricing calculations.
 * These functions implement business rules through pure, testable calculations.
 * 
 * ARCHITECTURAL ROLE: Procedural layer for pricing domain
 * USED BY: PricingService, GigService, CourseService
 * 
 * @author Gigsy Engineering Team
 * @version 1.0.0
 * @since 2025-01-01
 */

export interface Fee {
  readonly name: string;
  readonly amount: number;
}

export interface DiscountRule {
  readonly threshold: number;
  readonly percentage: number;
}

/**
 * Calculates tax amount for a given base price
 * @param basePrice - Price before tax
 * @param taxRate - Tax rate as decimal (0.08 = 8%)
 * @returns Tax amount in currency units
 * @throws {Error} When inputs are invalid
 */
export function calculateTax(basePrice: number, taxRate: number): number {
  if (basePrice < 0) {
    throw new Error("Base price cannot be negative");
  }
  if (taxRate < 0 || taxRate > 1) {
    throw new Error("Tax rate must be between 0 and 1");
  }
  
  return basePrice * taxRate;
}

/**
 * Calculates total amount from array of fees
 * @param fees - Array of fee objects
 * @returns Sum of all fee amounts
 * @throws {Error} When fees contain invalid amounts
 */
export function calculateFeesTotal(fees: Fee[]): number {
  if (!Array.isArray(fees)) {
    throw new Error("Fees must be an array");
  }
  
  return fees.reduce((total, fee) => {
    if (fee.amount < 0) {
      throw new Error(`Fee "${fee.name}" cannot have negative amount`);
    }
    return total + fee.amount;
  }, 0);
}

/**
 * Calculates discount amount based on order value and discount rules
 * @param orderValue - Total order value before discount
 * @param discountRule - Rule defining threshold and percentage
 * @returns Discount amount in currency units
 */
export function calculateDiscount(orderValue: number, discountRule: DiscountRule): number {
  if (orderValue < 0) {
    throw new Error("Order value cannot be negative");
  }
  
  if (orderValue < discountRule.threshold) {
    return 0;
  }
  
  return orderValue * discountRule.percentage;
}

/**
 * Calculates the final total price including tax and fees, minus discounts
 * @param basePrice - Original price before any modifications
 * @param taxRate - Tax rate as decimal (0.08 = 8%)
 * @param fees - Array of additional fees
 * @param discount - Discount amount to subtract
 * @returns Final total price
 * 
 * @example
 * ```typescript
 * const total = calculateTotalPrice(100, 0.08, [{ name: 'processing', amount: 5 }], 10);
 * // Returns: 103 (100 - 10 + 8 + 5)
 * ```
 */
export function calculateTotalPrice(
  basePrice: number,
  taxRate: number,
  fees: Fee[],
  discount = 0
): number {
  const discountedPrice = Math.max(0, basePrice - discount);
  const taxAmount = calculateTax(discountedPrice, taxRate);
  const feesTotal = calculateFeesTotal(fees);
  
  return discountedPrice + taxAmount + feesTotal;
}