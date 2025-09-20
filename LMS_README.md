# Modern LMS Implementation

A comprehensive Learning Management System built with Next.js App Router, featuring course management, video lessons, progress tracking, and interactive components.

## 🚀 Features

### Course Management

- **Course Detail Pages**: Rich course information with hero sections, author profiles, and enrollment CTAs
- **Module Organization**: Expandable module structure with lesson navigation
- **Progress Tracking**: Real-time progress updates and completion status
- **Resource Management**: Downloadable materials and external links

### Lesson Experience

- **Video Player**: Full-featured video player with controls, progress tracking, and keyboard shortcuts
- **Text Content**: Reading progress tracking with auto-scroll detection
- **Interactive Elements**: Comments, discussions, and lesson navigation
- **Mobile Optimization**: Touch-friendly controls and responsive design

### Technical Excellence

- **Next.js App Router**: Server-first architecture with selective client components
- **TypeScript**: Strict type safety with comprehensive type definitions
- **Accessibility**: WCAG AA compliance with screen reader support
- **Performance**: Optimized loading, caching, and code splitting

## 📁 Project Structure

```
src/
├── app/app/courses/                    # Course and lesson pages
│   ├── [courseId]/page.tsx            # Course detail page
│   └── [courseId]/lessons/[lessonId]/ # Lesson detail page
├── components/
│   ├── course/                        # Course-related components
│   │   ├── CourseHero.tsx            # Course hero section
│   │   ├── ModuleList.tsx            # Course modules display
│   │   └── CourseSummaryCard.tsx     # Course info card
│   ├── lesson/                        # Lesson-related components
│   │   ├── LessonPlayer.tsx          # Video player component
│   │   ├── LessonViewer.tsx          # Text content viewer
│   │   ├── LessonSidebar.tsx         # Lesson navigation
│   │   └── Comments.tsx              # Discussion system
│   └── ui/                           # Shared UI components
│       ├── AvatarStackWrapper.tsx    # Author avatar display
│       ├── ProgressRadial.tsx        # Progress indicators
│       └── slider.tsx                # Custom slider component
├── types/course.ts                   # TypeScript type definitions
├── schemas/course.ts                 # Zod validation schemas
├── utils/fetchers.ts                 # Data fetching utilities
├── hooks/useProgress.ts              # Progress tracking hooks
└── __tests__/                        # Test files
```

## 🛠 Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod schemas
- **Testing**: Jest + React Testing Library
- **Components**: shadcn/ui component library

## 🎯 Key Components

### Course Detail Page

```typescript
// app/courses/[courseId]/page.tsx
export default async function CoursePage({ params }: CoursePageProps) {
  const course = await getCourse(params.courseId);

  return (
    <div className="container mx-auto">
      <CourseHero course={course} />
      <ModuleList modules={course.modules} />
      <CourseSummaryCard course={course} />
    </div>
  );
}
```

### Lesson Detail Page

```typescript
// app/courses/[courseId]/lessons/[lessonId]/page.tsx
export default async function LessonPage({ params }: LessonPageProps) {
  const lesson = await getLessonWithNavigation(params.courseId, params.lessonId);

  return (
    <div className="grid lg:grid-cols-4">
      <div className="lg:col-span-3">
        {lesson.videoUrl ? (
          <LessonPlayer lesson={lesson} userId={userId} />
        ) : (
          <LessonViewer lesson={lesson} userId={userId} />
        )}
      </div>
      <LessonSidebar lesson={lesson} modules={modules} />
    </div>
  );
}
```

### Video Player Component

```typescript
export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  lesson,
  userId,
  autoPlay = false,
  onProgress,
}) => {
  const { updateProgress, markCompleted } = useProgress({
    lessonId: lesson.id,
    courseId: lesson.courseId,
    userId,
  });

  return (
    <div className="relative aspect-video">
      <video
        src={lesson.videoUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      {/* Video controls and UI */}
    </div>
  );
};
```

## 📊 Progress Tracking

### Server-Side Progress Storage

```typescript
export interface CourseProgress {
  courseId: string;
  userId: string;
  completedLessons: string[];
  currentLessonId?: string;
  progressPercentage: number;
  timeSpentSeconds: number;
  lastAccessedAt: string;
}

export interface LessonProgress {
  lessonId: string;
  progressSeconds: number;
  completed: boolean;
  watchedPercentage: number;
}
```

### Client-Side Progress Hook

```typescript
export const useProgress = ({ lessonId, courseId, userId }) => {
  const updateProgress = useCallback(
    (currentTime: number, duration: number) => {
      // Throttled progress updates every 5 seconds
      throttledUpdate(lessonId, currentTime, duration);
    },
    [lessonId],
  );

  const markCompleted = useCallback(async () => {
    await markLessonComplete(lessonId, courseId, userId);
  }, [lessonId, courseId, userId]);

  return { updateProgress, markCompleted /* ... */ };
};
```

## 🎨 Design System

### Theme Configuration

```css
/* CSS Variables for design tokens */
:root {
  --color-primary: 210 40% 50%;
  --color-secondary: 210 40% 95%;
  --color-accent: 210 40% 30%;
  --color-muted: 210 40% 85%;
}

.dark {
  --color-primary: 210 40% 70%;
  --color-secondary: 210 40% 15%;
  --color-accent: 210 40% 80%;
  --color-muted: 210 40% 25%;
}
```

### Component Variants

```typescript
// Using cn() utility for conditional classes
const lessonCard = cn(
  "rounded-lg border p-4 transition-colors",
  isActive && "border-primary bg-primary/5",
  isCompleted && "opacity-75",
  !canAccess && "cursor-not-allowed opacity-60",
);
```

## 🔧 Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgres://...
```

## 🧪 Testing

### Unit Tests

```typescript
// Component testing with React Testing Library
describe('CourseHero', () => {
  it('renders course information correctly', () => {
    render(<CourseHero course={mockCourse} />);

    expect(screen.getByText('React Advanced Patterns')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// Navigation flow testing
it('navigates from course to lesson', async () => {
  render(<ModuleList modules={mockModules} />);

  fireEvent.click(screen.getByText('Getting Started'));

  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledWith('/courses/1/lessons/1');
  });
});
```

## 📱 Responsive Design

### Breakpoint Strategy

- **Mobile**: 0-639px (single column, collapsible navigation)
- **Tablet**: 640-1023px (sidebar toggles, touch-optimized)
- **Desktop**: 1024px+ (full layout, hover states)

### Mobile Optimizations

- Touch-friendly video controls
- Collapsible sidebar with overlay
- Swipe gestures for lesson navigation
- Optimized text sizing and spacing

## ♿ Accessibility Features

### WCAG AA Compliance

- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: ARIA labels and descriptions
- **Color Contrast**: 4.5:1 minimum contrast ratio
- **Focus Management**: Visible focus indicators

### Video Player Accessibility

```typescript
<video
  aria-label={`${lesson.title} - Video lesson`}
  aria-describedby="video-description"
>
  <track kind="captions" src={lesson.captionsUrl} />
</video>
```

## 🚀 Performance Optimizations

### Next.js Features

- **Server Components**: Reduced client-side JavaScript
- **Image Optimization**: next/image with responsive sizing
- **Code Splitting**: Dynamic imports for heavy components
- **Caching**: ISR with selective revalidation

### Bundle Optimization

```typescript
// Dynamic imports for heavy components
const LessonPlayer = dynamic(() => import('@/components/lesson/LessonPlayer'), {
  ssr: false,
  loading: () => <PlayerSkeleton />,
});
```

### Caching Strategy

```typescript
// Server-side data fetching with caching
export async function getCourse(courseId: string): Promise<Course> {
  const response = await fetch(`/api/courses/${courseId}`, {
    next: { revalidate: 300, tags: [`course-${courseId}`] },
  });
  return courseSchema.parse(await response.json());
}
```

## 🔒 Security Considerations

### Content Security

- XSS prevention through proper escaping
- Content validation with Zod schemas
- Secure resource loading (HTTPS only)
- Rate limiting on progress updates

### User Data Protection

- Progress data encryption
- Secure session management
- GDPR compliance considerations
- Privacy-focused analytics

## 📈 Analytics Integration

### Learning Analytics

```typescript
export interface LessonAnalytics {
  lessonId: string;
  userId: string;
  events: Array<{
    type: "start" | "pause" | "complete" | "seek";
    timestamp: string;
    currentTime?: number;
  }>;
}
```

### Performance Monitoring

- Core Web Vitals tracking
- User engagement metrics
- Error monitoring and reporting
- Conversion funnel analysis

## 🌟 Best Practices

### Code Organization

- **Single Responsibility**: Each component has one clear purpose
- **Composition**: Building complex UIs from simple components
- **Type Safety**: Comprehensive TypeScript coverage
- **Error Boundaries**: Graceful error handling at component level

### Performance Guidelines

- Minimize client-side JavaScript
- Optimize images and media assets
- Use server components by default
- Implement proper loading states

### Accessibility Standards

- Test with screen readers
- Ensure keyboard navigation
- Maintain color contrast ratios
- Provide alternative text for media

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For questions or support, please contact the development team or create an issue in the repository.
