/**
 * PRICING SERVICE TESTS
 * 
 * Tests for the hybrid procedural/OOP pricing implementation.
 * Demonstrates testing strategy for both individual functions and service orchestration.
 */

import {
  calculateTax,
  calculateFeesTotal,
  calculateDiscount,
  calculateTotalPrice,
  type Fee,
  type DiscountRule
} from '../pricing';

describe('Pricing Calculations (Procedural Layer)', () => {
  describe('calculateTax', () => {
    describe('when inputs are valid', () => {
      it('should calculate tax correctly for standard rate', () => {
        // ARRANGE
        const basePrice = 100;
        const taxRate = 0.08;

        // ACT
        const result = calculateTax(basePrice, taxRate);

        // ASSERT
        expect(result).toBe(8);
      });

      it('should handle zero tax rate', () => {
        // ARRANGE
        const basePrice = 100;
        const taxRate = 0;

        // ACT
        const result = calculateTax(basePrice, taxRate);

        // ASSERT
        expect(result).toBe(0);
      });
    });

    describe('when inputs are invalid', () => {
      it('should throw error for negative base price', () => {
        // ARRANGE
        const basePrice = -100;
        const taxRate = 0.08;

        // ACT & ASSERT
        expect(() => calculateTax(basePrice, taxRate))
          .toThrow('Base price cannot be negative');
      });

      it('should throw error for invalid tax rate', () => {
        // ARRANGE
        const basePrice = 100;
        const taxRate = 1.5;

        // ACT & ASSERT
        expect(() => calculateTax(basePrice, taxRate))
          .toThrow('Tax rate must be between 0 and 1');
      });
    });
  });

  describe('calculateFeesTotal', () => {
    describe('when fees are valid', () => {
      it('should sum all fee amounts correctly', () => {
        // ARRANGE
        const fees: Fee[] = [
          { name: 'processing', amount: 5 },
          { name: 'shipping', amount: 10 },
          { name: 'handling', amount: 2.50 }
        ];

        // ACT
        const result = calculateFeesTotal(fees);

        // ASSERT
        expect(result).toBe(17.5);
      });

      it('should return zero for empty array', () => {
        // ARRANGE
        const fees: Fee[] = [];

        // ACT
        const result = calculateFeesTotal(fees);

        // ASSERT
        expect(result).toBe(0);
      });
    });

    describe('when fees are invalid', () => {
      it('should throw error for negative fee amount', () => {
        // ARRANGE
        const fees: Fee[] = [
          { name: 'processing', amount: 5 },
          { name: 'invalid', amount: -10 }
        ];

        // ACT & ASSERT
        expect(() => calculateFeesTotal(fees))
          .toThrow('Fee "invalid" cannot have negative amount');
      });
    });
  });

  describe('calculateDiscount', () => {
    describe('when order qualifies for discount', () => {
      it('should apply discount percentage correctly', () => {
        // ARRANGE
        const orderValue = 200;
        const discountRule: DiscountRule = { threshold: 100, percentage: 0.1 };

        // ACT
        const result = calculateDiscount(orderValue, discountRule);

        // ASSERT
        expect(result).toBe(20);
      });
    });

    describe('when order does not qualify for discount', () => {
      it('should return zero discount', () => {
        // ARRANGE
        const orderValue = 50;
        const discountRule: DiscountRule = { threshold: 100, percentage: 0.1 };

        // ACT
        const result = calculateDiscount(orderValue, discountRule);

        // ASSERT
        expect(result).toBe(0);
      });
    });
  });

  describe('calculateTotalPrice', () => {
    describe('when calculating complete pricing', () => {
      it('should combine all pricing components correctly', () => {
        // ARRANGE
        const basePrice = 100;
        const taxRate = 0.08;
        const fees: Fee[] = [{ name: 'processing', amount: 5 }];
        const discount = 10;

        // ACT
        const result = calculateTotalPrice(basePrice, taxRate, fees, discount);

        // ASSERT
        // Expected: (100 - 10) * 1.08 + 5 = 90 * 1.08 + 5 = 97.2 + 5 = 102.2
        expect(result).toBe(102.2);
      });

      it('should handle zero discount as default', () => {
        // ARRANGE
        const basePrice = 100;
        const taxRate = 0.08;
        const fees: Fee[] = [{ name: 'processing', amount: 5 }];

        // ACT
        const result = calculateTotalPrice(basePrice, taxRate, fees);

        // ASSERT
        // Expected: 100 * 1.08 + 5 = 108 + 5 = 113
        expect(result).toBe(113);
      });

      it('should not allow negative final price after discount', () => {
        // ARRANGE
        const basePrice = 50;
        const taxRate = 0.08;
        const fees: Fee[] = [{ name: 'processing', amount: 5 }];
        const discount = 100; // Larger than base price

        // ACT
        const result = calculateTotalPrice(basePrice, taxRate, fees, discount);

        // ASSERT
        // Expected: max(0, 50 - 100) + 0 + 5 = 0 + 0 + 5 = 5
        expect(result).toBe(5);
      });
    });
  });
});