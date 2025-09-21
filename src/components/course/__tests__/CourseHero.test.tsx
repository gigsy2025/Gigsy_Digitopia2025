/**
 * COURSE HERO COMPONENT TESTS
 *
 * Unit tests for the CourseHero component using React Testing Library.
 */

import { render, screen } from '@testing-library/react';
import { CourseHero } from '@/components/course/CourseHero';
import type { Course } from '@/types/course';

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, priority, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={props.alt} />;
  },
}));

const mockCourse: Course = {
  id: "course-1",
  title: "React Advanced Patterns",
  shortDescription: "Master advanced React patterns and techniques",
  description:
    "A comprehensive course on advanced React patterns including hooks, context, and performance optimization.",
  coverImage: "https://example.com/course-image.jpg",
  authors: [
    {
      id: "author-1",
      name: "John Doe",
      avatarUrl: "https://example.com/avatar1.jpg",
      role: "Senior Developer",
    },
    {
      id: "author-2",
      name: "Jane Smith",
      avatarUrl: "https://example.com/avatar2.jpg",
      role: "Tech Lead",
    },
  ],
  estimatedDurationMinutes: 480,
  difficulty: "advanced",
  modules: [],
  totalLessons: 24,
  stats: {
    enrolledCount: 1250,
    averageRating: 4.5,
    totalReviews: 120,
  },
  isFree: false,
  price: 99.99,
  currency: "USD",
};

describe("CourseHero", () => {
  it("renders course title and description", () => {
    render(<CourseHero course={mockCourse} />);

    expect(screen.getByText("React Advanced Patterns")).toBeInTheDocument();
    expect(
      screen.getByText("Master advanced React patterns and techniques"),
    ).toBeInTheDocument();
  });

  it("displays course metadata correctly", () => {
    render(<CourseHero course={mockCourse} />);

    expect(screen.getByText(/🔥 advanced/i)).toBeInTheDocument();
    expect(screen.getByText(/8h total/i)).toBeInTheDocument();
    expect(screen.getByText(/24 lessons/i)).toBeInTheDocument();
    expect(screen.getByText(/1,250 students/i)).toBeInTheDocument();
  });

  it("renders course cover image with correct attributes", () => {
    render(<CourseHero course={mockCourse} />);

    const image = screen.getByAltText("React Advanced Patterns");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/course-image.jpg");
  });

  it("displays author information", () => {
    render(<CourseHero course={mockCourse} />);

    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("shows price for paid courses", () => {
    render(<CourseHero course={mockCourse} />);

    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it('shows "Free" badge for free courses', () => {
    const freeCourse = { ...mockCourse, isFree: true, price: 0 };
    render(<CourseHero course={freeCourse} />);

    expect(screen.getByText("Free Course")).toBeInTheDocument();
  });

  it("renders enrollment button", () => {
    render(<CourseHero course={mockCourse} />);

    const enrollButton = screen.getByRole("button", {
      name: /enroll for \$99.99/i,
    });
    expect(enrollButton).toBeInTheDocument();
  });

  it("handles missing optional fields gracefully", () => {
    const minimalCourse: Course = {
      id: 'course-2',
      title: 'Basic Course',
      authors: [],
      modules: [],
      totalLessons: 5,
    };

    render(<CourseHero course={minimalCourse} />);
    
    expect(screen.getByText('Basic Course')).toBeInTheDocument();
    expect(screen.getByText('5 lessons')).toBeInTheDocument();
  });
});