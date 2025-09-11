/**
 * GIG PRICING SERVICE TESTS
 * 
 * Integration tests for the GigPricingService that demonstrate
 * testing strategy for OOP service layer that orchestrates procedural functions.
 */

import { GigPricingService, type GigDetails, type PricingConfiguration } from '../gig-pricing.service';

describe('GigPricingService (OOP Service Layer)', () => {
  let pricingService: GigPricingService;

  const testGigDetails: GigDetails = {
    scope: "Build e-commerce website",
    difficulty: "advanced",
    estimatedHours: 40,
    clientTier: "premium",
    location: "Remote"
  };

  beforeEach(() => {
    pricingService = new GigPricingService();
  });

  describe('generateQuote', () => {
    describe('when generating quote for valid gig', () => {
      it('should orchestrate all pricing calculations correctly', async () => {
        // ARRANGE
        const gigDetails = { ...testGigDetails };

        // ACT
        const quote = await pricingService.generateQuote(gigDetails);

        // ASSERT
        expect(quote.basePrice).toBe(3400); // 85 * 40 hours
        expect(quote.discount).toBe(170); // 5% of 3400 (premium tier)
        expect(quote.tax).toBe(258.4); // 8% of 3230 (after discount)
        expect(quote.fees).toHaveLength(2);
        expect(quote.fees[0]).toEqual({ name: 'platform_fee', amount: 10 });
        expect(quote.fees[1]).toEqual({ name: 'processing_fee', amount: 5 });
        expect(quote.total).toBe(3503.4); // (3400 - 170) + 258.4 + 15 = 3230 + 258.4 + 15 = 3503.4
        expect(quote.gigDetails).toEqual(gigDetails);
        expect(quote.generatedAt).toBeInstanceOf(Date);
      });

      it('should handle different difficulty levels correctly', async () => {
        // ARRANGE
        const beginnerGig: GigDetails = {
          ...testGigDetails,
          difficulty: "beginner",
          estimatedHours: 20
        };

        // ACT
        const quote = await pricingService.generateQuote(beginnerGig);

        // ASSERT
        expect(quote.basePrice).toBe(500); // 25 * 20 hours
        expect(quote.discount).toBe(25); // 5% of 500 (premium tier)
        expect(quote.tax).toBe(38); // 8% of 475 (after discount)
        expect(quote.total).toBe(528); // (500 - 25) + 38 + 15 = 475 + 38 + 15 = 528
      });

      it('should handle standard tier with no discount', async () => {
        // ARRANGE
        const standardGig: GigDetails = {
          ...testGigDetails,
          clientTier: "standard",
          difficulty: "intermediate",
          estimatedHours: 10
        };

        // ACT
        const quote = await pricingService.generateQuote(standardGig);

        // ASSERT
        expect(quote.basePrice).toBe(500); // 50 * 10 hours
        expect(quote.discount).toBe(0); // No discount for standard tier
        expect(quote.total).toBe(555); // 500 * 1.08 + 15 = 540 + 15 = 555
      });

      it('should handle enterprise tier with higher discount', async () => {
        // ARRANGE
        const enterpriseGig: GigDetails = {
          ...testGigDetails,
          clientTier: "enterprise",
          difficulty: "expert",
          estimatedHours: 20
        };

        // ACT
        const quote = await pricingService.generateQuote(enterpriseGig);

        // ASSERT
        expect(quote.basePrice).toBe(3000); // 150 * 20 hours
        expect(quote.discount).toBe(300); // 10% of 3000 (enterprise tier)
        expect(quote.total).toBe(2931); // (3000 - 300) * 1.08 + 15 = 2700 * 1.08 + 15 = 2916 + 15 = 2931
      });
    });

    describe('when gig details are invalid', () => {
      it('should throw error for empty scope', async () => {
        // ARRANGE
        const invalidGig: GigDetails = {
          ...testGigDetails,
          scope: ""
        };

        // ACT & ASSERT
        await expect(pricingService.generateQuote(invalidGig))
          .rejects.toThrow('Gig scope is required');
      });

      it('should throw error for zero estimated hours', async () => {
        // ARRANGE
        const invalidGig: GigDetails = {
          ...testGigDetails,
          estimatedHours: 0
        };

        // ACT & ASSERT
        await expect(pricingService.generateQuote(invalidGig))
          .rejects.toThrow('Estimated hours must be positive');
      });

      it('should throw error for excessive estimated hours', async () => {
        // ARRANGE
        const invalidGig: GigDetails = {
          ...testGigDetails,
          estimatedHours: 2500
        };

        // ACT & ASSERT
        await expect(pricingService.generateQuote(invalidGig))
          .rejects.toThrow('Estimated hours cannot exceed 2000 for a single gig');
      });
    });
  });

  describe('getPricingConfiguration', () => {
    it('should return immutable configuration object', () => {
      // ACT
      const config = pricingService.getPricingConfiguration();

      // ASSERT
      expect(config.hourlyRates.beginner).toBe(25);
      expect(config.hourlyRates.intermediate).toBe(50);
      expect(config.hourlyRates.advanced).toBe(85);
      expect(config.hourlyRates.expert).toBe(150);
      expect(config.taxRate).toBe(0.08);
      expect(config.standardFees).toHaveLength(2);

      // Verify immutability
      expect(Object.isFrozen(config)).toBe(true);
    });
  });

  describe('with custom pricing configuration', () => {
    it('should use custom rates and rules', async () => {
      // ARRANGE
      const customConfig: PricingConfiguration = {
        hourlyRates: {
          beginner: 30,
          intermediate: 60,
          advanced: 100,
          expert: 200
        },
        discountRules: {
          standard: { threshold: 0, percentage: 0 },
          premium: { threshold: 300, percentage: 0.1 },
          enterprise: { threshold: 800, percentage: 0.15 }
        },
        taxRate: 0.1,
        standardFees: [{ name: 'service_fee', amount: 20 }]
      };

      const customPricingService = new GigPricingService(customConfig);

      // ACT
      const quote = await customPricingService.generateQuote(testGigDetails);

      // ASSERT
      expect(quote.basePrice).toBe(4000); // 100 * 40 hours
      expect(quote.discount).toBe(400); // 10% of 4000 (custom premium tier)
      expect(quote.tax).toBe(360); // 10% of 3600 (after discount)
      expect(quote.fees).toHaveLength(1);
      expect(quote.fees[0]).toEqual({ name: 'service_fee', amount: 20 });
      expect(quote.total).toBe(3980); // (4000 - 400) + 360 + 20 = 3600 + 360 + 20 = 3980
    });
  });
});