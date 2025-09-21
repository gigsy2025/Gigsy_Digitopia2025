import { formatFileSize, formatPrice, formatNumber, truncateText, textToSlug, getInitials, formatRating, capitalizeWords, formatPercentage, stringToColor, stripHtml, formatSkillBadge, generateExcerpt, formatDifficulty, formatCategory } from '../format';

describe('format.ts', () => {
  describe('formatPrice', () => {
    it('should format price correctly', () => {
      expect(formatPrice(100)).toBe('$100');
      expect(formatPrice(99.99)).toBe('$99.99');
      expect(formatPrice(0)).toBe('Free');
    });
  });

  describe('formatNumber', () => {
    it('should format number correctly', () => {
      expect(formatNumber(10000)).toBe('10,000');
    });
  });

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      expect(truncateText('This is a long text', 10)).toBe('This is...');
      expect(truncateText('Short', 10)).toBe('Short');
    });

    it('should not truncate text if it is shorter than maxLength', () => {
      expect(truncateText('Short', 10)).toBe('Short');
    });
  });

  describe('textToSlug', () => {
    it('should convert text to slug', () => {
      expect(textToSlug('Hello World')).toBe('hello-world');
    });
  });

  describe('getInitials', () => {
    it('should get initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Single')).toBe('S');
    });
  });

  describe('formatFileSize', () => {
    it('should format file size correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024, 2)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024, 2)).toBe('1 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 1024, 2)).toBe('1 TB');
      expect(formatFileSize(1536, 1)).toBe('1.5 KB');
      expect(formatFileSize(1)).toBe('1 B');
    });

    it('should return "0 B" for 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
  });

  describe('formatRating', () => {
    it('should format rating correctly', () => {
      expect(formatRating(4.5)).toBe('★★★★☆');
      expect(formatRating(4.5, true)).toBe('★★★★☆ (4.5)');
    });
  });

  describe('capitalizeWords', () => {
    it('should capitalize words correctly', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(50)).toBe('50%');
      expect(formatPercentage(50.5, 1)).toBe('50.5%');
    });
  });

  describe('stringToColor', () => {
    it('should generate a color from a string', () => {
      expect(stringToColor('test')).toMatch(/hsl\(\d+, 65%, 50%\)/);
    });
  });

  describe('stripHtml', () => {
    it('should strip html tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello');
    });
  });

  describe('formatSkillBadge', () => {
    it('should format skill badge correctly', () => {
      expect(formatSkillBadge('react, nodejs')).toBe('React, Nodejs');
    });
  });

  describe('generateExcerpt', () => {
    it('should generate excerpt from html', () => {
      expect(generateExcerpt('<p>This is a long text</p>', 10)).toBe('This is...');
    });
  });

  describe('formatDifficulty', () => {
    it('should format difficulty correctly', () => {
      expect(formatDifficulty('advanced')).toBe('🔥 Advanced');
    });

    it('should return the same string if difficulty is not in the map', () => {
      // @ts-ignore
      expect(formatDifficulty('unknown')).toBe('unknown');
    });
  });

  describe('formatCategory', () => {
    it('should format category correctly', () => {
      expect(formatCategory('development')).toBe('💻 Development');
      expect(formatCategory('unknown')).toBe('Unknown');
    });
  });
});
