import "@testing-library/jest-dom";

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    private options: IntersectionObserverInit = {},
  ) {}

  disconnect(): void {
    // Mock implementation
  }

  observe(_target: Element): void {
    // Mock implementation
  }

  unobserve(_target: Element): void {
    // Mock implementation
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  disconnect(): void {
    // Mock implementation
  }

  observe(_target: Element, _options?: ResizeObserverOptions): void {
    // Mock implementation
  }

  unobserve(_target: Element): void {
    // Mock implementation
  }
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "";
  },
}));
