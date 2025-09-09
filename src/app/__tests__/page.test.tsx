import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

// Mock the Badge component
jest.mock("@/components/Badge", () => {
  return function MockBadge() {
    return <div data-testid="badge">Badge Component</div>;
  };
});

// Mock the AuthDisplay component
jest.mock("@/components/AuthDisplay", () => {
  return function MockAuthDisplay() {
    return <div data-testid="auth-display">Auth Display Component</div>;
  };
});

describe("HomePage", () => {
  it("renders the main heading correctly", () => {
    render(<HomePage />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Welcome to Gigsy");
  });

  it("renders the auth display component", () => {
    render(<HomePage />);

    const authDisplay = screen.getByTestId("auth-display");
    expect(authDisplay).toBeInTheDocument();
  });

  it("renders the badge component", () => {
    render(<HomePage />);

    const badge = screen.getByTestId("badge");
    expect(badge).toBeInTheDocument();
  });

  it("renders the getting started section", () => {
    render(<HomePage />);

    const gettingStartedHeading = screen.getByRole("heading", {
      name: /getting started/i,
    });
    expect(gettingStartedHeading).toBeInTheDocument();
  });

  it("renders the real-time features section", () => {
    render(<HomePage />);

    const realTimeFeaturesHeading = screen.getByRole("heading", {
      name: /real-time features/i,
    });
    expect(realTimeFeaturesHeading).toBeInTheDocument();
  });

  it("has proper CSS classes for styling", () => {
    render(<HomePage />);

    const main = screen.getByRole("main");
    expect(main).toHaveClass(
      "flex",
      "min-h-screen",
      "flex-col",
      "items-center",
      "justify-center",
    );
  });

  it("renders all major components in correct order", () => {
    render(<HomePage />);

    const container = screen.getByRole("main").querySelector(".container");
    expect(container).toBeInTheDocument();

    // Check that components are rendered in expected order
    const heading = screen.getByRole("heading", { level: 1 });
    const authDisplay = screen.getByTestId("auth-display");
    const badge = screen.getByTestId("badge");

    expect(heading).toBeInTheDocument();
    expect(authDisplay).toBeInTheDocument();
    expect(badge).toBeInTheDocument();
  });
});
