import { formatDuration, formatProgressTime, parseDuration, getRelativeTime, formatDate, calculateReadingTime, getTimeRemaining, calculatePercentage, debounce, throttle } from '../time';

describe('time.ts', () => {
  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(65, 'long')).toBe('1 minute, 5 seconds');
      expect(formatDuration(3661, 'short')).toBe('1h 1m');
      expect(formatDuration(65, 'minimal')).toBe('1:05');
    });

    it('should handle long format with only seconds', () => {
      expect(formatDuration(30, 'long')).toBe('30 seconds');
    });
  });

  describe('formatProgressTime', () => {
    it('should format progress time correctly', () => {
      expect(formatProgressTime(65, 3665)).toBe('1:05 / 1:01:05');
    });
  });

  describe('parseDuration', () => {
    it('should parse duration correctly', () => {
      expect(parseDuration('1h 30m')).toBe(5400);
      expect(parseDuration('90m')).toBe(5400);
    });
  });

  describe('getRelativeTime', () => {
    it('should get relative time correctly', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 1000 * 60 * 5); // 5 minutes ago
      expect(getRelativeTime(pastDate)).toBe('5 minutes ago');
    });

    it('should handle various time differences', () => {
      const now = new Date();
      expect(getRelativeTime(new Date(now.getTime() - 1000 * 30))).toBe('just now');
      expect(getRelativeTime(new Date(now.getTime() - 1000 * 60 * 60 * 24))).toBe('yesterday');
      expect(getRelativeTime(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7))).toBe('1 week ago');
      expect(getRelativeTime(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30))).toBe('1 month ago');
      expect(getRelativeTime(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365))).toBe('1 year ago');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-10-27T10:00:00Z');
      expect(formatDate(date, 'medium')).toBe('Oct 27, 2023');
    });

    it('should handle short and long formats', () => {
      const date = new Date('2023-10-27T10:00:00Z');
      expect(formatDate(date, 'short')).toBe('Oct 27');
      expect(formatDate(date, 'long')).toBe('Friday, October 27, 2023');
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time correctly', () => {
      const text = '<p>This is a sample text with 10 words.</p>';
      expect(calculateReadingTime(text, 5)).toBe(2);
    });
  });

  describe('getTimeRemaining', () => {
    it('should get time remaining correctly', () => {
      expect(getTimeRemaining(50, 600)).toBe(300);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(1, 2)).toBe(50);
      expect(calculatePercentage(1, 3)).toBe(33);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should call the function after the specified delay', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 500);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should call the function immediately and then not again until the limit is passed', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 500);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      throttledFunc();
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });
  });
});
