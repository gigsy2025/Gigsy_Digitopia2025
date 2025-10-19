# 🔧 Progress Tracking Debug Guide

## Overview

As a Principal Engineer, I've implemented comprehensive console logging throughout the progress tracking system to help debug why progress records aren't being created in the Convex database.

## 🚀 Enhanced Logging System

### 1. Frontend Progress Tracking (`useProgress.ts`)

**Comprehensive logging added to:**

- ✅ Progress hook initialization
- ✅ Convex query state changes
- ✅ Progress synchronization attempts
- ✅ Mutation calls and responses
- ✅ Error handling and retry logic
- ✅ Optimistic updates

**Key Log Messages:**

```javascript
🔵 [ProgressTracker:useProgress] 🚀 Progress tracking initialized
🔵 [ProgressTracker:useProgress] 📊 Progress query state changed
🔵 [ProgressTracker:useProgress] 🚀 Syncing progress to Convex
🔵 [ProgressTracker:useProgress] ✅ Progress sync successful
```

### 2. Lesson Page Debugging (`lessons/[lessonId]/page.tsx`)

**Enhanced logging covers:**

- ✅ Lesson page initialization
- ✅ User authentication status
- ✅ Video player events
- ✅ Progress update callbacks
- ✅ Debug UI for development

**Key Log Messages:**

```javascript
📝 [LessonPage:LessonDetail] 🚀 Lesson page initialized
📝 [LessonPage:LessonDetail] 🔐 User authentication status
📝 [LessonPage:VideoPlayer] 🎥 Video player initialized
📝 [LessonPage:VideoPlayer] 🔄 Video time update
```

### 3. Module Page Progress (`modules/[moduleId]/page.tsx`)

**Added comprehensive logging for:**

- ✅ Module progress tracking
- ✅ Course progress overview
- ✅ Lesson navigation clicks
- ✅ Authentication checks

**Key Log Messages:**

```javascript
📊 [ModulePage:ModuleDetail] 🚀 Module page initialized
📊 [ModulePage:ModuleDetail] 📈 Module progress loaded
📊 [ModulePage:ModuleDetail] 📖 Lesson selected
```

### 4. Convex Backend Debugging (`convex/lessons.ts`)

**Server-side logging includes:**

- ✅ Mutation request validation
- ✅ Database query operations
- ✅ Progress record creation/updates
- ✅ User authentication verification
- ✅ Analytics updates

**Key Log Messages:**

```javascript
🔵 [Convex:updateProgress] 🚀 Progress update request received
🔵 [Convex:updateProgress] 🔑 User authenticated
🔵 [Convex:updateProgress] 📄 Progress record lookup result
🔵 [Convex:updateProgress] ✅ Progress update successful
```

### 5. Course Page Enhancements (`courses/[courseId]/page.tsx`)

**Added metadata and loading logging:**

- ✅ Course preloading status
- ✅ Authentication token handling
- ✅ Metadata generation
- ✅ Error tracking

## 🔍 How to Use the Debug System

### Step 1: Enable Debug Logging

```javascript
// In browser console or localStorage
localStorage.setItem("debug-progress", "true");
localStorage.setItem("debug-lesson", "true");
localStorage.setItem("debug-module", "true");
```

### Step 2: Monitor Progress Flow

1. **Open browser DevTools Console**
2. **Navigate to a lesson page**
3. **Watch for initialization logs:**
   - 🚀 Component initialization
   - 🔐 Authentication status
   - 📊 Progress query states

### Step 3: Test Progress Tracking

1. **Use the debug UI (development mode)**
2. **Click "Test Progress (10%)" button**
3. **Monitor console for:**
   - 📋 Progress update attempts
   - 🚀 Convex mutation calls
   - ✅ Success confirmations
   - ❌ Error messages

### Step 4: Check Video Progress

1. **Play a video lesson**
2. **Watch for time update logs:**
   - 🔄 Video time updates
   - 📊 Progress calculations
   - 🚀 Sync attempts

## 🎯 Common Debug Scenarios

### Scenario 1: No Progress Records Created

**Check these logs in order:**

1. `🔐 User authentication status` - Ensure user is logged in
2. `📋 Progress update` - Verify progress tracking is called
3. `🚀 Syncing progress to Convex` - Check mutation attempts
4. `✅ Progress sync successful` vs `❌ Progress sync failed`

### Scenario 2: Video Progress Not Tracking

**Monitor these specific logs:**

1. `🎥 Video player initialized` - Player setup
2. `🔄 Video time update` - Time change events
3. `📋 Progress updated callback` - Hook integration
4. `⏰ Scheduling progress sync` - Throttled sync

### Scenario 3: Authentication Issues

**Look for these warning logs:**

1. `⚠️ Progress tracking disabled - no authenticated user`
2. `❌ Authentication failed - no user ID`
3. `🔐 User authentication status` - Check userId value

## 📊 Expected Log Flow

### Normal Progress Tracking Flow:

```
1. 📝 [LessonPage] 🚀 Lesson page initialized
2. 🔵 [ProgressTracker] 🚀 Progress tracking initialized
3. 🔐 [LessonPage] User authentication status: authenticated
4. 📊 [ProgressTracker] Progress query state changed: has-data
5. 🎥 [VideoPlayer] Video player initialized
6. 🔄 [VideoPlayer] Video time update: 30s/300s (10%)
7. 📋 [LessonPage] Progress updated callback
8. ⏰ [ProgressTracker] Scheduling progress sync via throttle
9. 🚀 [ProgressTracker] Syncing progress to Convex
10. 🔵 [Convex:updateProgress] Progress update request received
11. 🔑 [Convex:updateProgress] User authenticated
12. 📄 [Convex:updateProgress] Progress record lookup result
13. ✅ [Convex:updateProgress] Progress update successful
14. ✅ [ProgressTracker] Progress sync successful
```

## 🔧 Development Tools

### Debug UI Components

- **Progress Test Button**: Manually trigger 10% progress
- **Enable Debug Logs**: Turn on detailed logging
- **Progress Status Display**: Real-time progress information

### Browser Console Commands

```javascript
// Enable all debug logging
localStorage.setItem("debug-progress", "true");
localStorage.setItem("debug-lesson", "true");
localStorage.setItem("debug-module", "true");

// Check current progress state
console.log("Current progress:", window.progressState);

// Test progress update manually
window.testProgressUpdate?.(30, 300); // 30s of 300s video
```

## 🎯 Troubleshooting Steps

### If No Logs Appear:

1. ✅ Check browser console is open
2. ✅ Verify localStorage debug flags are set
3. ✅ Refresh page after setting debug flags
4. ✅ Check for JavaScript errors blocking execution

### If Progress Not Saving:

1. ✅ Verify user authentication (userId should be present)
2. ✅ Check Convex connection status
3. ✅ Monitor network tab for failed API calls
4. ✅ Look for database constraint errors in logs

### If Video Events Not Firing:

1. ✅ Check video src URL is valid
2. ✅ Verify video metadata loads successfully
3. ✅ Monitor video player event handlers
4. ✅ Check for React re-render issues

## 📈 Performance Considerations

The logging system follows enterprise best practices:

- **Conditional Logging**: Debug logs only in development/when enabled
- **Structured Data**: JSON serialization for complex objects
- **Performance Impact**: Minimal overhead in production
- **Memory Management**: No log accumulation or memory leaks

## 🚀 Production Deployment

Before deploying to production:

1. ✅ Remove or disable debug UI components
2. ✅ Ensure localStorage debug flags default to false
3. ✅ Keep error logging but reduce info/debug levels
4. ✅ Monitor performance impact of remaining logs

---

**Created by:** Principal Engineer  
**Purpose:** Debug progress tracking system  
**Date:** 2025-09-21  
**Status:** Ready for debugging 🔧
