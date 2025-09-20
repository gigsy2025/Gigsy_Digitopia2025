/**
 * LESSON PLAYER COMPONENT TESTS
 *
 * Unit tests for the LessonPlayer component.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LessonPlayer } from '@/components/lesson/LessonPlayer';
import type { LessonWithNavigation } from '@/types/course';

// Mock the useProgress hook
jest.mock('@/hooks/useProgress', () => ({
  useProgress: () => ({
    updateProgress: jest.fn(),
    markCompleted: jest.fn(),
    progressSeconds: 0,
    completed: false,
    watchedPercentage: 0,
  }),
}));

// Mock the utils
jest.mock('@/utils/time', () => ({
  formatDuration: (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
}));

const mockLesson: LessonWithNavigation = {
  id: 'lesson-1',
  title: 'Introduction to React',
  description: 'Learn the basics of React',
  videoUrl: 'https://example.com/video.mp4',
  durationSeconds: 600,
  sequenceIndex: 0,
  courseId: 'course-1',
  moduleId: 'module-1',
  module: {
    id: 'module-1',
    title: 'Getting Started',
    sequenceIndex: 0,
  },
  course: {
    id: 'course-1',
    title: 'React Course',
    totalLessons: 10,
  },
};

// Mock HTMLVideoElement
const mockVideo = {
  currentTime: 0,
  duration: 600,
  paused: true,
  muted: false,
  volume: 1,
  playbackRate: 1,
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

Object.defineProperty(window.HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: mockVideo.play,
});

Object.defineProperty(window.HTMLVideoElement.prototype, 'pause', {
  writable: true,
  value: mockVideo.pause,
});

describe('LessonPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders video player for lessons with video URL', () => {
    render(<LessonPlayer lesson={mockLesson} userId="user-1" />);
    
    const video = screen.getByRole('application');
    expect(video).toBeInTheDocument();
  });

  it('shows "No video available" message when video URL is missing', () => {
    const lessonWithoutVideo = { ...mockLesson, videoUrl: undefined };
    render(<LessonPlayer lesson={lessonWithoutVideo} userId="user-1" />);
    
    expect(screen.getByText('No video available for this lesson')).toBeInTheDocument();
  });

  it('displays play button overlay when video is paused', () => {
    render(<LessonPlayer lesson={mockLesson} userId="user-1" />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();
  });

  it('calls onProgress callback when provided', async () => {
    const onProgress = jest.fn();
    render(
      <LessonPlayer 
        lesson={mockLesson} 
        userId="user-1" 
        onProgress={onProgress}
      />
    );

    const video = screen.getByRole('application');
    
    // Simulate timeupdate event
    fireEvent.timeUpdate(video);
    
    await waitFor(() => {
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'timeupdate',
        })
      );
    });
  });

  it('handles video errors gracefully', () => {
    render(<LessonPlayer lesson={mockLesson} userId="user-1" />);
    
    const video = screen.getByRole('application');
    
    // Simulate error
    fireEvent.error(video);
    
    expect(screen.getByText('Video Error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows progress indicator when available', () => {
    // Mock the hook to return progress
    jest.doMock('@/hooks/useProgress', () => ({
      useProgress: () => ({
        updateProgress: jest.fn(),
        markCompleted: jest.fn(),
        progressSeconds: 60,
        completed: false,
        watchedPercentage: 10,
      }),
    }));

    render(<LessonPlayer lesson={mockLesson} userId="user-1" />);
    
    expect(screen.getByText('10% watched')).toBeInTheDocument();
  });

  it('enables autoplay when specified', () => {
    render(<LessonPlayer lesson={mockLesson} userId="user-1" autoPlay={true} />);
    
    const video = screen.getByRole('application');
    expect(video).toHaveAttribute('autoPlay');
  });
});