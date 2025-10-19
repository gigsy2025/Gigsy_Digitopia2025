# 🎥 Kibo Video Player Integration Guide

## Overview

This guide demonstrates how to effectively integrate and use the media-chrome based Kibo Video Player throughout the Gigsy platform. The Kibo Video Player provides superior performance, accessibility, and maintainability compared to custom video player implementations.

## Why Kibo Video Player?

### ✅ **Advantages over Custom Players**

1. **Web Standards Compliance**: Built on web components using media-chrome
2. **Superior Performance**: Leverages native browser video capabilities
3. **Built-in Accessibility**: WCAG 2.1 compliance out of the box
4. **Reduced Bundle Size**: Less custom JavaScript code
5. **Future-Proof**: Follows modern web component standards
6. **Better Browser Support**: Consistent behavior across browsers
7. **Automatic Updates**: Benefits from media-chrome improvements

### ❌ **Issues with Custom Players**

1. **Maintenance Overhead**: Complex custom code requires ongoing maintenance
2. **Browser Inconsistencies**: Different behavior across browsers
3. **Accessibility Gaps**: Manual implementation of ARIA and keyboard navigation
4. **Performance Issues**: Custom controls can impact video performance
5. **Bundle Size**: Large amount of custom JavaScript
6. **Testing Complexity**: More surface area for bugs

## Installation & Setup

### Prerequisites

The Kibo Video Player is already configured in the project with:

```json
{
  "media-chrome": "^4.13.1"
}
```

### Import Components

```tsx
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@/components/ui/kibo-ui/video-player";
```

## Basic Implementation

### Simple Video Player

```tsx
function BasicVideoPlayer() {
  return (
    <VideoPlayer className="overflow-hidden rounded-lg border">
      <VideoPlayerContent
        crossOrigin=""
        muted
        preload="auto"
        slot="media"
        src="https://example.com/video.mp4"
      />
      <VideoPlayerControlBar>
        <VideoPlayerPlayButton />
        <VideoPlayerSeekBackwardButton />
        <VideoPlayerSeekForwardButton />
        <VideoPlayerTimeRange />
        <VideoPlayerTimeDisplay showDuration />
        <VideoPlayerMuteButton />
        <VideoPlayerVolumeRange />
      </VideoPlayerControlBar>
    </VideoPlayer>
  );
}
```

### With Event Handling

```tsx
function EventHandledVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    // Analytics tracking
    trackEvent("video_play", { videoId: "lesson-123" });
  };

  const handlePause = () => {
    setIsPlaying(false);
    // Save progress
    saveProgress(videoRef.current?.currentTime || 0);
  };

  return (
    <VideoPlayer className="overflow-hidden rounded-lg border">
      <VideoPlayerContent
        ref={videoRef}
        crossOrigin=""
        preload="metadata"
        slot="media"
        src="https://example.com/video.mp4"
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <VideoPlayerControlBar>
        <VideoPlayerPlayButton />
        <VideoPlayerTimeRange />
        <VideoPlayerTimeDisplay showDuration />
        <VideoPlayerMuteButton />
        <VideoPlayerVolumeRange />
      </VideoPlayerControlBar>
    </VideoPlayer>
  );
}
```

## Advanced Patterns

### Course Lesson Integration

```tsx
interface CourseLessonPlayerProps {
  lesson: CourseLesson;
  onProgressUpdate: (progress: number) => void;
  onComplete: () => void;
}

function CourseLessonPlayer({
  lesson,
  onProgressUpdate,
  onComplete,
}: CourseLessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const currentProgress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
      onProgressUpdate(currentProgress);

      // Auto-complete at 95%
      if (currentProgress >= 95) {
        onComplete();
      }
    }
  }, [onProgressUpdate, onComplete]);

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{lesson.title}</h3>
        <Badge variant={progress >= 95 ? "default" : "secondary"}>
          {progress >= 95 ? "Completed" : `${Math.round(progress)}% Complete`}
        </Badge>
      </div>

      {/* Video Player */}
      <VideoPlayer className="overflow-hidden rounded-lg border">
        <VideoPlayerContent
          ref={videoRef}
          crossOrigin=""
          preload="metadata"
          slot="media"
          src={lesson.videoUrl}
          poster={lesson.thumbnailUrl}
          onTimeUpdate={handleTimeUpdate}
        />
        <VideoPlayerControlBar>
          <VideoPlayerPlayButton />
          <VideoPlayerSeekBackwardButton />
          <VideoPlayerSeekForwardButton />
          <VideoPlayerTimeRange />
          <VideoPlayerTimeDisplay showDuration />
          <VideoPlayerMuteButton />
          <VideoPlayerVolumeRange />
        </VideoPlayerControlBar>
      </VideoPlayer>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

### Responsive Design

```tsx
function ResponsiveVideoPlayer() {
  return (
    <div className="w-full">
      {/* Mobile-First Responsive */}
      <VideoPlayer className="aspect-video overflow-hidden rounded-lg border">
        <VideoPlayerContent
          crossOrigin=""
          preload="metadata"
          slot="media"
          src="https://example.com/video.mp4"
        />

        {/* Simplified controls for mobile */}
        <VideoPlayerControlBar className="md:hidden">
          <VideoPlayerPlayButton />
          <VideoPlayerTimeRange />
          <VideoPlayerMuteButton />
        </VideoPlayerControlBar>

        {/* Full controls for desktop */}
        <VideoPlayerControlBar className="hidden md:flex">
          <VideoPlayerPlayButton />
          <VideoPlayerSeekBackwardButton />
          <VideoPlayerSeekForwardButton />
          <VideoPlayerTimeRange />
          <VideoPlayerTimeDisplay showDuration />
          <VideoPlayerMuteButton />
          <VideoPlayerVolumeRange />
        </VideoPlayerControlBar>
      </VideoPlayer>
    </div>
  );
}
```

### Error Handling

```tsx
function RobustVideoPlayer({ src }: { src: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    setError("Failed to load video. Please try again.");
    setLoading(false);
  };

  const handleLoadedData = () => {
    setError(null);
    setLoading(false);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      <VideoPlayer className="overflow-hidden rounded-lg border">
        <VideoPlayerContent
          crossOrigin=""
          preload="metadata"
          slot="media"
          src={src}
          onError={handleError}
          onLoadedData={handleLoadedData}
        />
        <VideoPlayerControlBar>
          <VideoPlayerPlayButton />
          <VideoPlayerTimeRange />
          <VideoPlayerTimeDisplay showDuration />
          <VideoPlayerMuteButton />
          <VideoPlayerVolumeRange />
        </VideoPlayerControlBar>
      </VideoPlayer>
    </div>
  );
}
```

## Best Practices

### 1. **Performance Optimization**

```tsx
// ✅ Use preload="metadata" for better initial loading
<VideoPlayerContent preload="metadata" />

// ✅ Mute videos that autoplay (browser requirement)
<VideoPlayerContent muted autoPlay />

// ✅ Use crossOrigin for CORS compliance
<VideoPlayerContent crossOrigin="" />

// ✅ Provide poster images for better UX
<VideoPlayerContent poster="/path/to/thumbnail.jpg" />
```

### 2. **Accessibility**

```tsx
// ✅ Always include aria-labels for custom controls
<button aria-label="Play video" onClick={handlePlay}>
  <PlayIcon />
</button>

// ✅ Use semantic HTML structure
<div role="region" aria-label="Video player">
  <VideoPlayer>
    {/* Video content */}
  </VideoPlayer>
</div>

// ✅ Provide keyboard navigation
<VideoPlayer
  onKeyDown={handleKeyboardShortcuts}
  tabIndex={0}
>
```

### 3. **State Management**

```tsx
// ✅ Use refs for direct video element access
const videoRef = useRef<HTMLVideoElement>(null);

// ✅ Throttle progress updates to avoid excessive API calls
const handleTimeUpdate = useCallback(
  throttle(() => {
    // Update progress
  }, 1000),
  [],
);

// ✅ Clean up resources
useEffect(() => {
  return () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
  };
}, []);
```

### 4. **Integration with Convex**

```tsx
function ConvexVideoPlayer({ storageId }: { storageId: Id<"_storage"> }) {
  // ✅ Use Convex file URL query
  const fileUrl = useQuery(api.files.getFileUrl, { storageId });

  // ✅ Handle loading states
  if (!fileUrl) {
    return <VideoPlayerSkeleton />;
  }

  return (
    <VideoPlayer>
      <VideoPlayerContent src={fileUrl} />
      {/* Controls */}
    </VideoPlayer>
  );
}
```

## Migration Strategy

### From Custom KiboVideoPlayer

1. **Identify Usage**: Find all instances of the custom `KiboVideoPlayer`
2. **Replace Imports**: Update to use Kibo UI components
3. **Update Props**: Map custom props to standard HTML5 video attributes
4. **Event Handling**: Migrate custom event handlers to standard video events
5. **Styling**: Update CSS classes to work with media-chrome
6. **Testing**: Verify functionality across browsers and devices

### Example Migration

```tsx
// ❌ OLD: Custom KiboVideoPlayer
<KiboVideoPlayer
  src={videoUrl}
  title={lesson.title}
  onPlay={handlePlay}
  onProgressUpdate={handleProgress}
  responsive
  aspectRatio="16:9"
/>

// ✅ NEW: Kibo UI VideoPlayer
<VideoPlayer className="aspect-video">
  <VideoPlayerContent
    src={videoUrl}
    onPlay={handlePlay}
    onTimeUpdate={handleTimeUpdate}
    crossOrigin=""
    preload="metadata"
    slot="media"
  />
  <VideoPlayerControlBar>
    <VideoPlayerPlayButton />
    <VideoPlayerTimeRange />
    <VideoPlayerTimeDisplay showDuration />
    <VideoPlayerMuteButton />
    <VideoPlayerVolumeRange />
  </VideoPlayerControlBar>
</VideoPlayer>
```

## Common Patterns

### Video with Progress Tracking

```tsx
const VideoWithProgress = ({ videoUrl, onProgress }) => (
  <VideoPlayer>
    <VideoPlayerContent
      src={videoUrl}
      onTimeUpdate={(e) => {
        const progress = (e.target.currentTime / e.target.duration) * 100;
        onProgress(progress);
      }}
    />
    <VideoPlayerControlBar>
      <VideoPlayerPlayButton />
      <VideoPlayerTimeRange />
      <VideoPlayerTimeDisplay showDuration />
    </VideoPlayerControlBar>
  </VideoPlayer>
);
```

### Video Playlist

```tsx
const VideoPlaylist = ({ videos, currentIndex, onVideoChange }) => (
  <div className="space-y-4">
    <VideoPlayer>
      <VideoPlayerContent
        src={videos[currentIndex].url}
        onEnded={() => onVideoChange(currentIndex + 1)}
      />
      <VideoPlayerControlBar>
        <VideoPlayerPlayButton />
        <VideoPlayerTimeRange />
        <VideoPlayerTimeDisplay showDuration />
      </VideoPlayerControlBar>
    </VideoPlayer>

    <div className="flex space-x-2">
      {videos.map((video, index) => (
        <Button
          key={video.id}
          variant={index === currentIndex ? "default" : "outline"}
          onClick={() => onVideoChange(index)}
        >
          {video.title}
        </Button>
      ))}
    </div>
  </div>
);
```

## Testing Guidelines

### Unit Tests

```tsx
describe("VideoPlayer", () => {
  it("should play video when play button is clicked", async () => {
    render(<VideoPlayer src="test.mp4" />);

    const playButton = screen.getByRole("button", { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(mockVideoElement.play).toHaveBeenCalled();
    });
  });
});
```

### Integration Tests

```tsx
describe("Course Video Player", () => {
  it("should track progress and mark completion", async () => {
    const onComplete = jest.fn();
    render(<CourseVideoPlayer lesson={mockLesson} onComplete={onComplete} />);

    // Simulate video progress to 95%
    fireEvent.timeUpdate(screen.getByRole("video"), {
      target: { currentTime: 57, duration: 60 },
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
```

## Conclusion

The media-chrome based Kibo Video Player provides a robust, accessible, and maintainable solution for video playback in the Gigsy platform. By following these patterns and best practices, you can create high-quality video experiences that work consistently across all browsers and devices while minimizing maintenance overhead.

### Key Takeaways

1. **Use standard web components** instead of custom implementations
2. **Follow accessibility guidelines** from the start
3. **Implement proper error handling** and loading states
4. **Optimize for performance** with appropriate preload strategies
5. **Test across browsers and devices** to ensure compatibility
6. **Leverage Convex integration** for seamless file handling

This approach ensures that video functionality remains stable, performant, and accessible as the platform grows and evolves.
