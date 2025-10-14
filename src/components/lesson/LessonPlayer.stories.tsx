/**
 * LESSON PLAYER COMPONENT EXAMPLES
 *
 * Component examples and variations for the LessonPlayer component.
 * These can be used as a reference for Storybook stories when Storybook is set up.
 */

import React from "react";
import type { Meta } from "@storybook/nextjs";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import type {
  LessonWithNavigation,
  PlayerEvent as PlayerEventType,
} from "@/types/course";

// Base lesson data
const baseLesson: LessonWithNavigation = {
  id: "lesson-1",
  title: "Introduction to React Components",
  description:
    "Learn the fundamentals of React components and how to create reusable UI elements.",
  videoUrl:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  thumbnailUrl:
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop",
  durationSeconds: 845, // 14:05
  sequenceIndex: 0,
  courseId: "course-1",
  moduleId: "module-1",
  module: {
    id: "module-1",
    title: "React Fundamentals",
    sequenceIndex: 0,
  },
  course: {
    id: "course-1",
    title: "Complete React Course",
    totalLessons: 25,
  },
  resources: [
    {
      id: "resource-1",
      title: "Component Examples",
      url: "https://example.com/components.zip",
      type: "zip",
      sizeBytes: 1024 * 512, // 512KB
    },
    {
      id: "resource-2",
      title: "React Documentation",
      url: "https://reactjs.org/docs",
      type: "link",
    },
  ],
  nextLesson: {
    id: "lesson-2",
    title: "Props and State",
    moduleId: "module-1",
  },
  previousLesson: undefined,
};

// Example component variations
export const DefaultLessonPlayer = () => (
  <div className="mx-auto max-w-4xl p-4">
    <LessonPlayer lesson={baseLesson} userId="user-123" />
  </div>
);

export const AutoPlayLessonPlayer = () => (
  <div className="mx-auto max-w-4xl p-4">
    <LessonPlayer lesson={baseLesson} userId="user-123" autoPlay={true} />
  </div>
);

export const LessonPlayerWithCallbacks = () => {
  /**
   * Handles progress events from the LessonPlayer.
   * @param event - PlayerEvent object containing current time and watched percentage.
   */
  const handleProgress = (event: PlayerEventType) => {
    console.log("Progress event:", event);
  };

  const handleComplete = () => {
    console.log("Lesson completed!");
  };

  const handleError = (error: string) => {
    console.error("Player error:", error);
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <LessonPlayer
        lesson={baseLesson}
        userId="user-123"
        onProgress={handleProgress}
        onComplete={handleComplete}
        onError={handleError}
      />
    </div>
  );
};

export const LessonPlayerNoVideo = () => (
  <div className="mx-auto max-w-4xl p-4">
    <LessonPlayer
      lesson={{
        ...baseLesson,
        videoUrl: undefined,
      }}
      userId="user-123"
    />
  </div>
);

export const ShortLessonPlayer = () => (
  <div className="mx-auto max-w-4xl p-4">
    <LessonPlayer
      lesson={{
        ...baseLesson,
        title: "Quick Tip: Arrow Functions",
        durationSeconds: 180, // 3 minutes
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      }}
      userId="user-123"
    />
  </div>
);

export const LongLessonPlayer = () => (
  <div className="mx-auto max-w-4xl p-4">
    <LessonPlayer
      lesson={{
        ...baseLesson,
        title: "Deep Dive: Advanced React Patterns",
        durationSeconds: 3600, // 1 hour
        description:
          "A comprehensive exploration of advanced React patterns including render props, higher-order components, and custom hooks.",
      }}
      userId="user-123"
    />
  </div>
);

export const LessonPlayerWithManyResources = () => (
  <div className="mx-auto max-w-4xl p-4">
    <LessonPlayer
      lesson={{
        ...baseLesson,
        resources: [
          {
            id: "resource-1",
            title: "Starter Code",
            url: "https://example.com/starter.zip",
            type: "zip",
            sizeBytes: 1024 * 256,
          },
          {
            id: "resource-2",
            title: "Final Solution",
            url: "https://example.com/solution.zip",
            type: "zip",
            sizeBytes: 1024 * 512,
          },
          {
            id: "resource-3",
            title: "Slides (PDF)",
            url: "https://example.com/slides.pdf",
            type: "pdf",
            sizeBytes: 1024 * 1024 * 2, // 2MB
          },
          {
            id: "resource-4",
            title: "Additional Reading",
            url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
            type: "link",
          },
          {
            id: "resource-5",
            title: "Code Repository",
            url: "https://github.com/example/react-examples",
            type: "link",
          },
        ],
      }}
      userId="user-123"
    />
  </div>
);

export const MobileLessonPlayer = () => (
  <div className="mx-auto max-w-sm p-2">
    <LessonPlayer lesson={baseLesson} userId="user-123" className="w-full" />
  </div>
);

const meta: Meta<typeof LessonPlayer> = {
  title: "Components/Lesson/LessonPlayer",
  component: LessonPlayer,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/react/configure/story-layout
    layout: "fullscreen",
    // Mock the useProgress hook for all stories in this file
    jest: ["@/hooks/useProgress"],
  },
  decorators: [
    (Story, { parameters }) => {
      // Mock implementation for useProgress
      jest.mock("@/hooks/useProgress", () => ({
        useProgress: () => ({
          updateProgress: (...args: unknown[]) => {
            console.log("Mock updateProgress called", ...args);
          },
          markCompleted: () => {
            console.log("Mock markCompleted called");
          },
          progressSeconds: 0,
          completed: false,
          watchedPercentage: 0,
        }),
      }));

      return <Story />;
    },
  ],
};

export default meta;

// Export all examples for easy import
export const LessonPlayerExamples = {
  Default: DefaultLessonPlayer,
  AutoPlay: AutoPlayLessonPlayer,
  WithCallbacks: LessonPlayerWithCallbacks,
  NoVideo: LessonPlayerNoVideo,
  Short: ShortLessonPlayer,
  Long: LongLessonPlayer,
  ManyResources: LessonPlayerWithManyResources,
  Mobile: MobileLessonPlayer,
};
