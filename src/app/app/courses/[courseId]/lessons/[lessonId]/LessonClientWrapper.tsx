/**
 * LESSON CLIENT WRAPPER
 *
 * Client Component wrapper for handling dynamic imports with ssr: false
 * while maintaining Server Component benefits for the main page.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

// "use client";

// import React, { Suspense } from "react";
// import dynamic from "next/dynamic";
// import { Skeleton } from "@/components/ui/skeleton";
// import type { LessonWithNavigation } from "@/types/course";

// // Dynamically import heavy components with ssr: false
// const LessonPlayer = dynamic(() => import("@/components/lesson/LessonPlayer"), {
//   ssr: false,
//   loading: () => <LessonPlayerSkeleton />,
// });

// const Comments = dynamic(() => import("@/components/lesson/Comments"), {
//   ssr: false,
//   loading: () => (
//     <div className="text-muted-foreground py-8 text-center">
//       Loading comments...
//     </div>
//   ),
// });

// // Also import LessonViewer dynamically for consistency
// const LessonViewer = dynamic(
//   () =>
//     import("@/components/lesson").then((mod) => ({
//       default: mod.LessonViewer,
//     })),
//   {
//     ssr: false,
//     loading: () => <div className="py-8 text-center">Loading content...</div>,
//   },
// );

// /**
//  * Lesson Player Skeleton
//  */
// const LessonPlayerSkeleton: React.FC = () => (
//   <div className="aspect-video w-full">
//     <Skeleton className="h-full w-full rounded-lg" />
//   </div>
// );

// /**
//  * Lesson Content Component
//  */
// interface LessonContentProps {
//   lesson: LessonWithNavigation;
//   userId: string;
// }

// export const LessonContent: React.FC<LessonContentProps> = ({
//   lesson,
//   userId,
// }) => {
//   // Determine content type and render appropriate component
//   // Check for video content (either legacy videoUrl or new content structure)
//   const hasVideo =
//     lesson.videoUrl ??
//     (lesson.content &&
//       (lesson.content.startsWith("http") ||
//         lesson.content.startsWith("blob:") ||
//         lesson.content.includes("video")));

//   if (hasVideo) {
//     return (
//       <Suspense fallback={<LessonPlayerSkeleton />}>
//         <LessonPlayer
//           lesson={lesson}
//           userId={userId}
//           autoPlay={false}
//           className="w-full"
//         />
//       </Suspense>
//     );
//   }

//   // Check for text content (contentHtml or content)
//   const hasTextContent = lesson.contentHtml || (lesson.content && !hasVideo);

//   if (hasTextContent) {
//     return (
//       <Suspense
//         fallback={<div className="py-8 text-center">Loading content...</div>}
//       >
//         <LessonViewer lesson={lesson} userId={userId} className="w-full" />
//       </Suspense>
//     );
//   }

//   // No content available
//   return (
//     <div className="bg-muted/50 flex h-64 flex-col items-center justify-center rounded-lg border">
//       <div className="text-muted-foreground text-lg font-medium">
//         No content available
//       </div>
//       <div className="text-muted-foreground text-sm">
//         This lesson is currently being prepared.
//       </div>
//     </div>
//   );
// };

// /**
//  * Comments Section Component
//  */
// interface CommentsProps {
//   lessonId: string;
//   userId: string;
// }

// export const CommentsSection: React.FC<CommentsProps> = ({
//   lessonId,
//   userId,
// }) => {
//   return (
//     <div className="bg-card space-y-4 rounded-lg border p-6">
//       <h2 className="text-lg font-semibold">Discussion</h2>
//       <Suspense
//         fallback={
//           <div className="text-muted-foreground py-8 text-center">
//             Loading comments...
//           </div>
//         }
//       >
//         <Comments lessonId={lessonId} userId={userId} />
//       </Suspense>
//     </div>
//   );
// };
