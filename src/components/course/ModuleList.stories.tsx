import type { Meta, StoryObj } from "@storybook/nextjs";
import { ModuleList } from "@/components/course/ModuleList";
import type { Module } from "@/types/course";

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

const moduleWithManyLessons: Module = {
  id: "module-large",
  title: "Comprehensive React Course",
  description: "Everything you need to know about React.",
  sequenceIndex: 0,
  lessons: Array.from({ length: 15 }, (_, index) => ({
    id: `lesson-${index + 1}`,
    title: `Lesson ${index + 1}: React Topic ${index + 1}`,
    description: `Learn about React topic ${index + 1} in detail.`,
    sequenceIndex: index,
    durationSeconds: 300 + index * 60,
    videoUrl: `https://example.com/video${index + 1}.mp4`,
    isLocked: index > 2,
    isFree: index < 3,
  })),
};

const meta: Meta<typeof ModuleList> = {
  title: "Course/ModuleList",
  component: ModuleList,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-4xl p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    modules: sampleModules,
    courseId: "course-1",
    isEnrolled: true,
    completedLessons: [],
    userProgress: {},
    onLessonSelect: () => undefined,
  },
};

export default meta;

type Story = StoryObj<typeof ModuleList>;

export const Default: Story = {};

export const WithProgress: Story = {
  args: {
    completedLessons: ["lesson-1", "lesson-2", "lesson-4"],
    userProgress: {
      "lesson-3": 75,
      "lesson-5": 30,
    },
    currentLessonId: "lesson-5",
  },
};

export const NotEnrolled: Story = {
  args: {
    isEnrolled: false,
  },
};

export const FullyCompleted: Story = {
  args: {
    completedLessons: [
      "lesson-1",
      "lesson-2",
      "lesson-3",
      "lesson-4",
      "lesson-5",
      "lesson-6",
      "lesson-7",
      "lesson-8",
    ],
    currentLessonId: "lesson-8",
  },
};

export const WithCallbacks: Story = {
  args: {
    onLessonSelect: (lessonId: string) => {
      console.info(`[ModuleList] Selected lesson: ${lessonId}`);
    },
  },
};

export const SingleModule: Story = {
  args: {
    modules: [sampleModules[0]!],
    completedLessons: ["lesson-1"],
    currentLessonId: "lesson-2",
  },
};

export const Empty: Story = {
  args: {
    modules: [],
  },
};

export const ManyLessons: Story = {
  args: {
    modules: [moduleWithManyLessons],
    isEnrolled: false,
  },
};

export const Mobile: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-sm p-2">
        <Story />
      </div>
    ),
  ],
  args: {
    completedLessons: ["lesson-1"],
    currentLessonId: "lesson-2",
  },
};

export const Compact: Story = {
  args: {
    className: "text-sm",
  },
};
