import type { Meta, StoryObj } from "@storybook/nextjs";
import { CourseHero } from "@/components/course/CourseHero";
import type { Course } from "@/types/course";

const baseCourse: Course = {
  id: "course-1",
  title: "Complete React Developer Course",
  shortDescription:
    "Master React from beginner to advanced with real-world projects and modern best practices.",
  description:
    "This comprehensive course will take you from a complete beginner to an advanced React developer. You'll learn hooks, context, testing, performance optimization, and build real-world applications.",
  coverImage:
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
  authors: [
    {
      id: "author-1",
      name: "Sarah Johnson",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108755-2616b612c8e3?w=150&h=150&fit=crop&crop=face",
      role: "Senior React Developer",
    },
    {
      id: "author-2",
      name: "Mike Chen",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      role: "Tech Lead",
    },
  ],
  estimatedDurationMinutes: 1440,
  difficulty: "intermediate",
  modules: [],
  totalLessons: 42,
  enrolledCount: 12840,
  price: 89.99,
  currency: "USD",
  isFree: false,
  tags: ["react", "javascript", "frontend", "web-development"],
  skills: [
    "React Hooks",
    "Component Design",
    "State Management",
    "Testing",
    "Performance",
  ],
  stats: {
    enrolledCount: 12840,
    completionRate: 87,
    averageRating: 4.8,
    totalReviews: 3420,
    recentEnrollments: 156,
  },
};

const meta: Meta<typeof CourseHero> = {
  title: "Course/CourseHero",
  component: CourseHero,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    course: baseCourse,
    isEnrolled: false,
    userProgress: 0,
    onEnroll: () => undefined,
    onContinue: () => undefined,
    onShare: () => undefined,
    onWishlist: () => undefined,
  },
};

export default meta;

type Story = StoryObj<typeof CourseHero>;

export const Default: Story = {};

export const Free: Story = {
  args: {
    course: {
      ...baseCourse,
      title: "Introduction to Web Development",
      price: 0,
      isFree: true,
      difficulty: "beginner",
      estimatedDurationMinutes: 360,
      totalLessons: 15,
      enrolledCount: 45230,
    },
  },
};

export const Advanced: Story = {
  args: {
    course: {
      ...baseCourse,
      title: "Advanced React Patterns & Architecture",
      difficulty: "advanced",
      price: 149.99,
      estimatedDurationMinutes: 2160,
      totalLessons: 68,
      enrolledCount: 4350,
      stats: baseCourse.stats
        ? {
            ...baseCourse.stats,
            enrolledCount: 4350,
            averageRating: 4.9,
            totalReviews: 890,
          }
        : undefined,
    },
  },
};

export const SingleAuthor: Story = {
  args: {
    course: {
      ...baseCourse,
      title: "JavaScript Fundamentals",
      authors: [
        {
          id: "author-1",
          name: "Alex Rodriguez",
          avatarUrl:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          role: "JavaScript Expert",
        },
      ],
    },
  },
};

export const Minimal: Story = {
  args: {
    course: {
      id: "course-minimal",
      title: "Basic Course",
      authors: [],
      modules: [],
      totalLessons: 5,
      isFree: true,
    },
  },
};
