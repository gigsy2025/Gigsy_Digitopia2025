/**
 * MODULE LIST COMPONENT EXAMPLES
 *
 * Component examples and variations for the ModuleList component.
 * These can be used as a reference for Storybook stories when Storybook is set up.
 */

import React from "react";
import { ModuleList } from "@/components/course/ModuleList";
import type { Module } from "@/types/course";

// Sample modules data
const sampleModules: Module[] = [
  {
    id: "module-1",
    title: "Getting Started with React",
    description:
      "Learn the fundamentals of React and set up your development environment.",
    sequenceIndex: 0,
    lessons: [
      {
        id: "lesson-1",
        title: "Introduction to React",
        description: "What is React and why use it?",
        sequenceIndex: 0,
        durationSeconds: 480,
        videoUrl: "https://example.com/video1.mp4",
        isFree: true,
      },
      {
        id: "lesson-2",
        title: "Setting Up Your Environment",
        description: "Install Node.js, npm, and create your first React app.",
        sequenceIndex: 1,
        durationSeconds: 720,
        videoUrl: "https://example.com/video2.mp4",
      },
      {
        id: "lesson-3",
        title: "Understanding JSX",
        description: "Learn the syntax that makes React components possible.",
        sequenceIndex: 2,
        durationSeconds: 540,
        contentHtml: "<p>JSX lesson content...</p>",
        resources: [
          {
            id: "resource-1",
            title: "JSX Cheatsheet",
            url: "https://example.com/jsx-cheatsheet.pdf",
            type: "pdf",
          },
        ],
      },
    ],
  },
  {
    id: "module-2",
    title: "React Components",
    description: "Deep dive into creating and managing React components.",
    sequenceIndex: 1,
    lessons: [
      {
        id: "lesson-4",
        title: "Functional Components",
        description: "Learn how to create functional components.",
        sequenceIndex: 0,
        durationSeconds: 600,
        videoUrl: "https://example.com/video4.mp4",
      },
      {
        id: "lesson-5",
        title: "Props and PropTypes",
        description: "Passing data between components safely.",
        sequenceIndex: 1,
        durationSeconds: 780,
        videoUrl: "https://example.com/video5.mp4",
        isLocked: true,
      },
      {
        id: "lesson-6",
        title: "Component Composition",
        description: "Building complex UIs with simple components.",
        sequenceIndex: 2,
        durationSeconds: 900,
        contentHtml: "<p>Component composition lesson...</p>",
        resources: [
          {
            id: "resource-2",
            title: "Component Examples",
            url: "https://example.com/components.zip",
            type: "zip",
            sizeBytes: 1024 * 512,
          },
        ],
      },
    ],
  },
  {
    id: "module-3",
    title: "State Management",
    description: "Managing application state with hooks and context.",
    sequenceIndex: 2,
    lessons: [
      {
        id: "lesson-7",
        title: "useState Hook",
        description: "Managing local component state.",
        sequenceIndex: 0,
        durationSeconds: 660,
        videoUrl: "https://example.com/video7.mp4",
      },
      {
        id: "lesson-8",
        title: "useEffect Hook",
        description: "Side effects and lifecycle in functional components.",
        sequenceIndex: 1,
        durationSeconds: 840,
        videoUrl: "https://example.com/video8.mp4",
      },
    ],
  },
];

// Example component variations
export const DefaultModuleList = () => (
  <div className="mx-auto max-w-4xl p-4">
    <ModuleList modules={sampleModules} courseId="course-1" isEnrolled={true} />
  </div>
);

export const ModuleListWithProgress = () => (
  <div className="mx-auto max-w-4xl p-4">
    <ModuleList
      modules={sampleModules}
      courseId="course-1"
      isEnrolled={true}
      completedLessons={["lesson-1", "lesson-2", "lesson-4"]}
      userProgress={{
        "lesson-3": 75,
        "lesson-5": 30,
      }}
      currentLessonId="lesson-5"
    />
  </div>
);

export const ModuleListNotEnrolled = () => (
  <div className="mx-auto max-w-4xl p-4">
    <ModuleList
      modules={sampleModules}
      courseId="course-1"
      isEnrolled={false}
    />
  </div>
);

export const ModuleListFullyCompleted = () => (
  <div className="mx-auto max-w-4xl p-4">
    <ModuleList
      modules={sampleModules}
      courseId="course-1"
      isEnrolled={true}
      completedLessons={[
        "lesson-1",
        "lesson-2",
        "lesson-3",
        "lesson-4",
        "lesson-5",
        "lesson-6",
        "lesson-7",
        "lesson-8",
      ]}
      currentLessonId="lesson-8"
    />
  </div>
);

export const ModuleListWithCallbacks = () => {
  const handleLessonSelect = (lessonId: string) => {
    console.log("Selected lesson:", lessonId);
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <ModuleList
        modules={sampleModules}
        courseId="course-1"
        isEnrolled={true}
        onLessonSelect={handleLessonSelect}
      />
    </div>
  );
};

export const SingleModuleList = () => {
  const firstModule = sampleModules[0];
  if (!firstModule) return <div>No modules available</div>;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <ModuleList
        modules={[firstModule]}
        courseId="course-1"
        isEnrolled={true}
        completedLessons={["lesson-1"]}
        currentLessonId="lesson-2"
      />
    </div>
  );
};

export const EmptyModuleList = () => (
  <div className="mx-auto max-w-4xl p-4">
    <ModuleList modules={[]} courseId="course-1" isEnrolled={true} />
  </div>
);

export const ModuleListWithManyLessons = () => {
  const moduleWithManyLessons: Module = {
    id: "module-large",
    title: "Comprehensive React Course",
    description: "Everything you need to know about React.",
    sequenceIndex: 0,
    lessons: Array.from({ length: 15 }, (_, i) => ({
      id: `lesson-${i + 1}`,
      title: `Lesson ${i + 1}: React Topic ${i + 1}`,
      description: `Learn about React topic ${i + 1} in detail.`,
      sequenceIndex: i,
      durationSeconds: 300 + i * 60,
      videoUrl: `https://example.com/video${i + 1}.mp4`,
      isLocked: i > 2, // First 3 lessons are free
      isFree: i < 3,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <ModuleList
        modules={[moduleWithManyLessons]}
        courseId="course-1"
        isEnrolled={false}
      />
    </div>
  );
};

export const MobileModuleList = () => (
  <div className="mx-auto max-w-sm p-2">
    <ModuleList
      modules={sampleModules}
      courseId="course-1"
      isEnrolled={true}
      completedLessons={["lesson-1"]}
      currentLessonId="lesson-2"
    />
  </div>
);

export const CompactModuleList = () => (
  <div className="mx-auto max-w-2xl p-4">
    <ModuleList
      modules={sampleModules}
      courseId="course-1"
      isEnrolled={true}
      className="text-sm"
    />
  </div>
);

// Export all examples for easy import
export const ModuleListExamples = {
  Default: DefaultModuleList,
  WithProgress: ModuleListWithProgress,
  NotEnrolled: ModuleListNotEnrolled,
  FullyCompleted: ModuleListFullyCompleted,
  WithCallbacks: ModuleListWithCallbacks,
  SingleModule: SingleModuleList,
  Empty: EmptyModuleList,
  ManyLessons: ModuleListWithManyLessons,
  Mobile: MobileModuleList,
  Compact: CompactModuleList,
};
