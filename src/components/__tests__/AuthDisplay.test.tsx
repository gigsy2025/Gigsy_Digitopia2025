import { render, screen } from "@testing-library/react";
import AuthDisplay from "@/components/AuthDisplay";

// Mock Clerk's hooks and components before importing
jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in-button-wrapper">{children}</div>
  ),
  SignOutButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-out-button-wrapper">{children}</div>
  ),
}));

// Import after mocking
import { useUser } from "@clerk/nextjs";

// Get the mocked version - we'll use any to work around strict typing
const mockUseUser = useUser as jest.MockedFunction<any>;

describe("AuthDisplay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state when authentication is not loaded", () => {
    mockUseUser.mockReturnValue({
      isLoaded: false,
      isSignedIn: undefined,
      user: null,
    });

    render(<AuthDisplay />);

    expect(screen.getByText("Loading authentication...")).toBeInTheDocument();
    // Check for the spinner element
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows not signed in state when user is not authenticated", () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    });

    render(<AuthDisplay />);

    expect(screen.getByTestId("auth-status")).toHaveTextContent(
      "Not Signed In",
    );
    expect(
      screen.getByText("Please sign in to access personalized features"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("sign-in-button")).toBeInTheDocument();
    expect(screen.queryByTestId("sign-out-button")).not.toBeInTheDocument();
  });

  it("shows signed in state with user information when user is authenticated", () => {
    const mockUser = {
      id: "user_123456789",
      fullName: "John Doe",
      emailAddresses: [{ emailAddress: "john.doe@example.com" }],
    };

    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: mockUser,
    });

    render(<AuthDisplay />);

    expect(screen.getByTestId("auth-status")).toHaveTextContent("Signed In");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Name: John Doe");
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "Email: john.doe@example.com",
    );
    expect(screen.getByTestId("user-id")).toHaveTextContent(
      "User ID: user_123456789",
    );
    expect(screen.getByTestId("sign-out-button")).toBeInTheDocument();
    expect(screen.queryByTestId("sign-in-button")).not.toBeInTheDocument();
  });

  it("handles user with missing information gracefully", () => {
    const mockUser = {
      id: "user_123456789",
      fullName: null,
      emailAddresses: [],
    };

    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: mockUser,
    });

    render(<AuthDisplay />);

    expect(screen.getByTestId("auth-status")).toHaveTextContent("Signed In");
    expect(screen.getByTestId("user-name")).toHaveTextContent(
      "Name: Not provided",
    );
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "Email: Not provided",
    );
    expect(screen.getByTestId("user-id")).toHaveTextContent(
      "User ID: user_123456789",
    );
  });

  it("renders the authentication status heading", () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    });

    render(<AuthDisplay />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Authentication Status");
  });

  it("has proper accessibility attributes", () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    });

    render(<AuthDisplay />);

    const signInButton = screen.getByTestId("sign-in-button");
    expect(signInButton).toBeInTheDocument();
    // The sign-in button should be accessible as a button
    expect(signInButton.tagName).toBe("BUTTON");
  });
});
