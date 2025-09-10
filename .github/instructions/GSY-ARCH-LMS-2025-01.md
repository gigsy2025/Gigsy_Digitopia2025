---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

# Gigsy LMS Service

**Document ID:** GSY-ARCH-LMS-2025-01 **Version:** 1.0 **Date:** September 10, 2025 **Author:** Mostafa Yaser, Software Architect **Status:** Final

## **1\. Architectural Overview of the Learning Management Service (LMS)**

The LMS is the educational core of the Gigsy platform. It provides the structured environment where students acquire new skills. This architecture is designed as a normalized relational model to ensure scalability, data integrity, and the ability to perform detailed analytics on student progress.

### **Key Architectural Principles:**

* **Normalized Structure:** A course is broken down into `modules`, and modules are broken down into `lessons`. This normalized approach allows for content reuse, easier course management, and a clear, hierarchical learning path for students.  
* **Granular Progress Tracking:** We will not store a simple percentage. Instead, we will track a student's completion status for *each individual lesson* in a dedicated `lessonProgress` table. This provides a rich dataset for understanding user engagement and identifying difficult concepts.  
* **Integrated Comprehension Checks:** The requirement for a quiz every 25 minutes is architected as a "comprehension check" system. Quizzes are tied directly to lessons. The frontend will be responsible for the timing mechanism (triggering the quiz UI), while the backend will handle quiz content delivery and attempt tracking.  
* **Clear Enrollment State:** A dedicated `enrollments` table acts as the "join" between a `user` and a `course`, signifying the start of their learning journey and acting as a parent record for all their progress within that course.

### **2\. Convex Schema Definition (`convex/schema.ts`)**

The following is a complete set of table definitions for the LMS. This is a comprehensive schema and should be added to your `convex/schema.ts` file.

import { defineSchema, defineTable } from "convex/server";  
import { v } from "convex/values";

export default defineSchema({  
  // ... users, gigs, applications table definitions ...

  // \--- LMS Core Content Tables \---

  courses: defineTable({  
    title: v.string(),  
    description: v.string(),  
    authorId: v.id("users"), // The \`\_id\` of the user (e.g., employer, admin) who created the course.  
    // Standard System Fields  
    updatedAt: v.number(),  
    createdBy: v.string(),  
    deletedAt: v.optional(v.number()),  
  }).index("by\_author", \["authorId"\]),

  modules: defineTable({  
    courseId: v.id("courses"),  
    title: v.string(),  
    order: v.number(), // The sequence of this module within the course.  
    // Standard System Fields  
    updatedAt: v.number(),  
    createdBy: v.string(),  
    deletedAt: v.optional(v.number()),  
  }).index("by\_course", \["courseId"\]),

  lessons: defineTable({  
    moduleId: v.id("modules"),  
    title: v.string(),  
    content: v.string(), // Could be markdown text, or a URL to a video.  
    order: v.number(),   // The sequence of this lesson within the module.  
    // Standard System Fields  
    updatedAt: v.number(),  
    createdBy: v.string(),  
    deletedAt: v.optional(v.number()),  
  }).index("by\_module", \["moduleId"\]),

  // \--- LMS User Progress & Enrollment \---

  enrollments: defineTable({  
    studentId: v.id("users"),  
    courseId: v.id("courses"),  
    status: v.string(), // e.g., "in\_progress", "completed".  
    // Standard System Fields  
    updatedAt: v.number(),  
    createdBy: v.string(),  
    deletedAt: v.optional(v.number()),  
  }).index("by\_student\_and\_course", \["studentId", "courseId"\]),

  lessonProgress: defineTable({  
    enrollmentId: v.id("enrollments"),  
    lessonId: v.id("lessons"),  
    status: v.string(), // e.g., "not\_started", "in\_progress", "completed".  
    // Standard System Fields  
    updatedAt: v.number(),  
    createdBy: v.string(),  
  }).index("by\_enrollment\_and\_lesson", \["enrollmentId", "lessonId"\]),

  // \--- Quiz System Tables \---

  quizzes: defineTable({  
    lessonId: v.id("lessons"),  
    question: v.string(),  
    order: v.number(), // If a lesson has multiple timed quizzes.  
  }).index("by\_lesson", \["lessonId"\]),

  quizOptions: defineTable({  
    quizId: v.id("quizzes"),  
    text: v.string(),  
    isCorrect: v.boolean(),  
  }).index("by\_quiz", \["quizId"\]),

  quizAttempts: defineTable({  
    studentId: v.id("users"),  
    quizId: v.id("quizzes"),  
    selectedOptionId: v.id("quizOptions"),  
    isCorrect: v.boolean(), // Denormalized for easier querying.  
    // Standard System Fields  
    createdBy: v.string(),  
  }).index("by\_student\_and\_quiz", \["studentId", "quizId"\]),

  // ... other tables ...  
});

### **3\. Implementation Notes & Next Steps**

* **Quiz Trigger Logic (Frontend):** The responsibility for the "25-minute" timer lies with the Next.js frontend. When a user is viewing a lesson, a `setTimeout` or similar timer will run. When it fires, the frontend will pause the video/content and make a query to the Convex backend to fetch the quiz and options associated with the current `lessonId`.  
* **Quiz Submission (Backend):** The frontend will send the user's answer to a `submitQuizAttempt` mutation. This backend function will:  
  1. Verify the user is enrolled.  
  2. Check if the `selectedOptionId` is correct by looking up the option in the `quizOptions` table.  
  3. Record the attempt in the `quizAttempts` table.  
  4. Return the result (correct/incorrect) to the frontend, which will then display the appropriate feedback and resume the lesson.  
* **Progress Updates:** A `markLessonAsComplete` mutation will be created. This function will update the `lessonProgress` status to `"completed"`. After this mutation, an `action` should be triggered to check if all lessons in the course are complete. If so, it should update the parent `enrollment` status to `"completed"`.  
* **Permissions:** Clear permission checks are vital. Only authenticated users can enroll. Course creation might be limited to users with an `"employer"` or `"admin"` role. A user must be enrolled to submit a quiz attempt or mark a lesson as complete.
