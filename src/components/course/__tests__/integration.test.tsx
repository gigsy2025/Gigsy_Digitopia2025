/**
 * INTEGRATION TESTS
 *
 * Integration tests for course navigation and lesson progress flow.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { ModuleList } from "@/components/course/ModuleList";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
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

  it("tracks lesson progress during playback", async () => {
    // Mock video element
    const mockVideo = {
      currentTime: 0,
      duration: 300,
      play: jest.fn(() => Promise.resolve()),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Mock createElement to return our mock video
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === "video") {
        return mockVideo as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    render(<LessonPlayer lesson={mockLesson} userId="user-1" />);

    // Simulate video time update
    act(() => {
      mockVideo.currentTime = 150; // 50% progress
      const timeUpdateEvent = new Event("timeupdate");
      mockVideo.addEventListener.mock.calls.find(
        (call) => call[0] === "timeupdate",
      )?.[1](timeUpdateEvent);
    });

    await waitFor(() => {
      expect(mockUpdateProgress).toHaveBeenCalledWith(150, 300);
    });

    // Restore original createElement
    document.createElement = originalCreateElement;
  });

  it("marks lesson as completed when finished", async () => {
    const mockVideo = {
      currentTime: 300,
      duration: 300,
      play: jest.fn(() => Promise.resolve()),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === "video") {
        return mockVideo as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    render(<LessonPlayer lesson={mockLesson} userId="user-1" />);

    // Simulate video ended
    act(() => {
      const endedEvent = new Event("ended");
      mockVideo.addEventListener.mock.calls.find(
        (call) => call[0] === "ended",
      )?.[1](endedEvent);
    });

    await waitFor(() => {
      expect(mockMarkCompleted).toHaveBeenCalled();
    });

    // Restore original createElement
    document.createElement = originalCreateElement;
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
    const completedLesson = screen.getByText("Getting Started");
    expect(completedLesson.closest("div")).toHaveClass("text-green-600");
  });

  it("enables next lesson navigation after completion", () => {
    render(
      <ModuleList
        modules={mockModules}
        courseId="course-1"
        isEnrolled={true}
        completedLessons={["lesson-1"]}
        currentLessonId="lesson-1"
      />,
    );

    // Should show next lesson as accessible
    const moduleButton = screen.getByRole("button", { name: /introduction/i });
    fireEvent.click(moduleButton);

    const nextLesson = screen.getByText("Next Steps");
    expect(nextLesson.closest("a")).toHaveAttribute(
      "href",
      "/app/courses/course-1/lessons/lesson-2",
    );
  });

  it("maintains progress state across navigation", () => {
    const { rerender } = render(
      <ModuleList
        modules={mockModules}
        courseId="course-1"
        isEnrolled={true}
        userProgress={{ "lesson-1": 50 }}
      />,
    );

    // Check initial progress
    const moduleButton = screen.getByRole("button", { name: /introduction/i });
    fireEvent.click(moduleButton);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Update progress and re-render
    rerender(
      <ModuleList
        modules={mockModules}
        courseId="course-1"
        isEnrolled={true}
        userProgress={{ "lesson-1": 100 }}
        completedLessons={["lesson-1"]}
      />,
    );

    // Should now show completed status
    expect(screen.getByTestId("check-circle")).toBeInTheDocument();
  });
});
