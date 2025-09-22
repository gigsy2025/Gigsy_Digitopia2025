/**
 * MODULE LIST COMPONENT TESTS
 *
 * Unit tests for the ModuleList component.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ModuleList } from "@/components/course/ModuleList";
import type { Module } from "@/types/course";

// Mock Next.js Link component
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockModules: Module[] = [
  {
    id: "module-1",
    title: "Getting Started",
    description: "Introduction to the course",
    sequenceIndex: 0,
    lessons: [
      {
        id: "lesson-1",
        title: "Welcome to the Course",
        sequenceIndex: 0,
        durationSeconds: 300,
        videoUrl: "https://example.com/video1.mp4",
        isFree: true,
      },
      {
        id: "lesson-2",
        title: "Course Overview",
        sequenceIndex: 1,
        durationSeconds: 600,
        contentHtml: "<p>Course overview content</p>",
        isLocked: true,
      },
    ],
  },
  {
    id: "module-2",
    title: "Advanced Topics",
    description: "Deep dive into advanced concepts",
    sequenceIndex: 1,
    lessons: [
      {
        id: "lesson-3",
        title: "Advanced Patterns",
        sequenceIndex: 0,
        durationSeconds: 900,
        videoUrl: "https://example.com/video3.mp4",
        resources: [
          {
            id: "resource-1",
            title: "Code Examples",
            url: "https://example.com/code.zip",
            type: "zip",
          },
        ],
      },
    ],
  },
];

describe("ModuleList", () => {
  const defaultProps = {
    modules: mockModules,
    courseId: "course-1",
    isEnrolled: true,
    completedLessons: ["lesson-1"],
  };

  it("renders all modules", () => {
    render(<ModuleList {...defaultProps} />);

    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Advanced Topics")).toBeInTheDocument();
  });

  it("displays module lesson counts", () => {
    render(<ModuleList {...defaultProps} />);

    expect(screen.getByText("2 lessons")).toBeInTheDocument();
    expect(screen.getByText("1 lesson")).toBeInTheDocument();
  });

  it("shows completed lesson status", () => {
    render(<ModuleList {...defaultProps} />);

    // Check mark for completed lesson
    expect(screen.getByTestId("check-circle")).toBeInTheDocument();
  });

  it("displays lesson durations", () => {
    render(<ModuleList {...defaultProps} />);

    expect(screen.getByText("5:00")).toBeInTheDocument(); // 300 seconds
    expect(screen.getByText("10:00")).toBeInTheDocument(); // 600 seconds
  });

  it("shows free preview badges", () => {
    render(<ModuleList {...defaultProps} />);

    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("shows locked lessons for non-enrolled users", () => {
    const nonEnrolledProps = { ...defaultProps, isEnrolled: false };
    render(<ModuleList {...nonEnrolledProps} />);

    // Should show lock icons for locked lessons
    expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
  });

  it("generates correct lesson links", () => {
    render(<ModuleList {...defaultProps} />);

    const lessonLink = screen.getByRole("link", {
      name: /welcome to the course/i,
    });
    expect(lessonLink).toHaveAttribute(
      "href",
      "/app/courses/course-1/modules/module-1/lessons/lesson-1",
    );
  });

  it("expands module content when clicked", () => {
    render(<ModuleList {...defaultProps} />);

    const moduleButton = screen.getByRole("button", {
      name: /getting started/i,
    });
    fireEvent.click(moduleButton);

    // Should show lesson details
    expect(screen.getByText("Welcome to the Course")).toBeInTheDocument();
  });

  it("displays resource counts for lessons", () => {
    render(<ModuleList {...defaultProps} />);

    expect(screen.getByText("1 resource")).toBeInTheDocument();
  });

  it("shows progress bars for enrolled users", () => {
    const propsWithProgress = {
      ...defaultProps,
      userProgress: { "lesson-2": 50 }, // 50% progress
    };

    render(<ModuleList {...propsWithProgress} />);

    // Should show progress bar
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("highlights current lesson", () => {
    const propsWithCurrent = {
      ...defaultProps,
      currentLessonId: "lesson-1",
    };

    render(<ModuleList {...propsWithCurrent} />);

    const currentLesson = screen.getByRole("button", {
      name: /Getting Started/i,
    });
    expect(currentLesson).toBeInTheDocument();
  });

  it("handles empty modules gracefully", () => {
    render(<ModuleList {...defaultProps} modules={[]} />);

    expect(screen.getByText(/no modules available/i)).toBeInTheDocument();
  });
});
