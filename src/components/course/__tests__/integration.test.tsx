/**
 * INTEGRATION TESTS
 *
 * Integration tests for course navigation and lesson progress flow.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { ModuleList } from "@/components/course/ModuleList";
import type { Module, LessonWithNavigation } from "@/types/course";

// Mock Next.js router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

// Mock Next.js Link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

// Mock LessonPlayer component
jest.mock("@/components/lesson/LessonPlayer", () => ({
  __esModule: true,
  LessonPlayer: () => <div>Mock Lesson Player</div>,
}));

// Mock useProgress hook
const mockUpdateProgress = jest.fn();
const mockMarkCompleted = jest.fn();

jest.mock("@/hooks/useProgress", () => ({
  useProgress: () => ({
    updateProgress: mockUpdateProgress,
    markCompleted: mockMarkCompleted,
    progressSeconds: 0,
    completed: false,
    watchedPercentage: 0,
  }),
}));

const mockModules: Module[] = [
  {
    id: "module-1",
    title: "Introduction",
    lessons: [
      {
        id: "lesson-1",
        title: "Getting Started",
        sequenceIndex: 0,
        videoUrl: "https://example.com/video1.mp4",
        durationSeconds: 300,
      },
      {
        id: "lesson-2",
        title: "Next Steps",
        sequenceIndex: 1,
        videoUrl: "https://example.com/video2.mp4",
        durationSeconds: 600,
      },
    ],
  },
];

const mockLesson: LessonWithNavigation = {
  id: "lesson-1",
  title: "Getting Started",
  videoUrl: "https://example.com/video1.mp4",
  durationSeconds: 300,
  sequenceIndex: 0,
  courseId: "course-1",
  moduleId: "module-1",
  module: {
    id: "module-1",
    title: "Introduction",
    sequenceIndex: 0,
  },
  course: {
    id: "course-1",
    title: "Test Course",
    totalLessons: 2,
  },
  nextLesson: {
    id: "lesson-2",
    title: "Next Steps",
    moduleId: "module-1",
  },
};

describe("Course Navigation Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates from course page to lesson", async () => {
    render(
      <ModuleList
        modules={mockModules}
        courseId="course-1"
        isEnrolled={true}
      />,
    );

    // Expand the module
    const moduleButton = screen.getByRole("button", { name: /introduction/i });
    fireEvent.click(moduleButton);

    // Click on first lesson
    const lessonLink = screen.getByText("Getting Started");
    fireEvent.click(lessonLink);

    // Should navigate to lesson page
    expect(lessonLink.closest("a")).toHaveAttribute(
      "href",
      "/app/courses/course-1/lessons/lesson-1",
    );
  });

  const mockVideo = {
    currentTime: 0,
    duration: 300,
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    setAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    load: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it("shows completed status in module list after lesson completion", () => {
    render(
      <ModuleList
        modules={mockModules}
        courseId="course-1"
        isEnrolled={true}
        completedLessons={["lesson-1"]}
      />,
    );

    // Expand module to see lessons
    const moduleButton = screen.getByRole("button", { name: /introduction/i });
    fireEvent.click(moduleButton);

    // Should show check mark for completed lesson
    expect(screen.getByTestId("check-circle")).toBeInTheDocument();
  });

  it("shows progress bar for in-progress lessons", async () => {
    render(
      <ModuleList
        modules={mockModules}
        courseId="course-1"
        isEnrolled={true}
        userProgress={{ "lesson-1": 50 }}
      />,
    );

    const moduleButton = screen.getByRole("button", { name: /introduction/i });
    fireEvent.click(moduleButton);

    await waitFor(() => {
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  it("shows completed icon for completed lessons", async () => {
    render(
      <ModuleList
        modules={mockModules}
        courseId="course-1"
        isEnrolled={true}
        completedLessons={["lesson-1"]}
      />,
    );

    const moduleButton = screen.getByRole("button", { name: /introduction/i });
    fireEvent.click(moduleButton);

    await waitFor(() => {
      expect(screen.getByTestId("check-circle")).toBeInTheDocument();
    });
  });
});
