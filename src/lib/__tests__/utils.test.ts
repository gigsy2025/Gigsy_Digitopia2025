import {
  formatPrice,
  calculateTotalPrice,
  validateEmail,
  truncateText,
  cn,
} from "../utils";

describe("Utils", () => {
  describe("cn (className utility)", () => {
    it("should merge class names correctly", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      expect(cn("base", true && "conditional", false && "hidden")).toBe(
        "base conditional",
      );
    });
  });

  describe("formatPrice", () => {
    it("should format positive numbers as USD currency", () => {
      expect(formatPrice(10.99)).toBe("$10.99");
      expect(formatPrice(1000)).toBe("$1,000.00");
      expect(formatPrice(0)).toBe("$0.00");
    });

    it("should handle large numbers", () => {
      expect(formatPrice(1234567.89)).toBe("$1,234,567.89");
    });

    it("should handle decimal places correctly", () => {
      expect(formatPrice(9.5)).toBe("$9.50");
      expect(formatPrice(100.123)).toBe("$100.12");
    });
  });

  describe("calculateTotalPrice", () => {
    it("should calculate price with tax correctly", () => {
      expect(calculateTotalPrice(100, 0.08)).toBe(108);
      expect(Number(calculateTotalPrice(50, 0.1).toFixed(2))).toBe(55);
      expect(calculateTotalPrice(0, 0.08)).toBe(0);
    });

    it("should handle zero tax rate", () => {
      expect(calculateTotalPrice(100, 0)).toBe(100);
    });

    it("should throw error for negative base price", () => {
      expect(() => calculateTotalPrice(-10, 0.08)).toThrow(
        "Base price cannot be negative",
      );
    });

    it("should throw error for negative tax rate", () => {
      expect(() => calculateTotalPrice(100, -0.05)).toThrow(
        "Tax rate cannot be negative",
      );
    });

    it("should handle decimal calculations precisely", () => {
      const result = calculateTotalPrice(99.99, 0.0825);
      expect(Number(result.toFixed(2))).toBe(108.24);
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email addresses", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.uk")).toBe(true);
      expect(validateEmail("email+tag@example.org")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
      expect(validateEmail("test@example")).toBe(false);
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("test.example.com")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(validateEmail("a@b.c")).toBe(true); // minimal valid email
      expect(validateEmail("test@example.com")).toBe(true); // normal email without trailing dot
      expect(validateEmail(" test@example.com ")).toBe(false); // spaces
    });
  });

  describe("truncateText", () => {
    it("should not truncate text shorter than maxLength", () => {
      expect(truncateText("short", 10)).toBe("short");
      expect(truncateText("exact", 5)).toBe("exact");
    });

    it("should truncate text longer than maxLength", () => {
      expect(truncateText("this is a long text", 10)).toBe("this is a ...");
      expect(truncateText("hello world", 5)).toBe("hello...");
    });

    it("should handle empty string", () => {
      expect(truncateText("", 5)).toBe("");
    });

    it("should handle zero maxLength", () => {
      expect(truncateText("test", 0)).toBe("...");
    });

    it("should preserve exact length when text equals maxLength", () => {
      expect(truncateText("12345", 5)).toBe("12345");
    });
  });
});
