import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

// Mock Clerk components
jest.mock("@clerk/nextjs", () => ({
  SignInButton: () => <button data-testid="sign-in-button">Sign In</button>,
  UserButton: () => <button data-testid="user-button">User Menu</button>,
}));

// Mock Convex components
jest.mock("convex/react", () => ({
  Authenticated: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="authenticated">{children}</div>
  ),
  Unauthenticated: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="unauthenticated">{children}</div>
  ),
  useQuery: jest.fn(),
}));

// Mock the Badge component
jest.mock("@/components/Badge", () => {
  return function MockBadge() {
    return <div data-testid="badge">Badge Component</div>;
  };
});

describe("HomePage", () => {
  it("renders the authenticated section with user button and badge", () => {
    render(<HomePage />);

    const authenticatedSection = screen.getByTestId("authenticated");
    expect(authenticatedSection).toBeInTheDocument();

    const userButton = screen.getByTestId("user-button");
    expect(userButton).toBeInTheDocument();

    const badge = screen.getByTestId("badge");
    expect(badge).toBeInTheDocument();
  });

  it("renders the unauthenticated section with sign in button", () => {
    render(<HomePage />);

    const unauthenticatedSection = screen.getByTestId("unauthenticated");
    expect(unauthenticatedSection).toBeInTheDocument();

    const signInButton = screen.getByTestId("sign-in-button");
    expect(signInButton).toBeInTheDocument();
  });

  it("renders both authenticated and unauthenticated sections", () => {
    render(<HomePage />);

    // Both sections should render (they're both present in the JSX)
    expect(screen.getByTestId("authenticated")).toBeInTheDocument();
    expect(screen.getByTestId("unauthenticated")).toBeInTheDocument();
  });
});
