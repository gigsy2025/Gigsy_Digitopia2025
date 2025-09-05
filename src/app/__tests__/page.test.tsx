import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

// Mock the theme toggle component
jest.mock("@/components/theme-toggle", () => ({
  ModeToggle: () => <div data-testid="mode-toggle">Theme Toggle</div>,
}));

describe("HomePage", () => {
  it("renders the main heading correctly", () => {
    render(<HomePage />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Create T3 App");
  });

  it("renders the theme toggle component", () => {
    render(<HomePage />);

    const themeToggle = screen.getByTestId("mode-toggle");
    expect(themeToggle).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<HomePage />);

    const firstStepsLink = screen.getByRole("link", { name: /first steps/i });
    const documentationLink = screen.getByRole("link", {
      name: /documentation/i,
    });

    expect(firstStepsLink).toBeInTheDocument();
    expect(firstStepsLink).toHaveAttribute(
      "href",
      "https://create.t3.gg/en/usage/first-steps",
    );

    expect(documentationLink).toBeInTheDocument();
    expect(documentationLink).toHaveAttribute(
      "href",
      "https://create.t3.gg/en/introduction",
    );
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
});
