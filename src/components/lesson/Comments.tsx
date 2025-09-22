/**
 * COMMENTS COMPONENT
 *
 * Interactive comments section for lessons with threaded replies,
 * real-time updates, and moderation features.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Heart,
  Reply,
  MoreHorizontal,
  Flag,
  ThumbsUp,
} from "lucide-react";
import type { Comment } from "@/types/course";

interface CommentsProps {
  lessonId: string;
  userId: string;
  className?: string;
}

// Mock comments data - in real app, this would come from API
const mockComments: Comment[] = [
  {
    id: "1",
    lessonId: "lesson-1",
    userId: "user-1",
    userName: "John Doe",
    userAvatar: "https://github.com/johndoe.png",
    content:
      "Great explanation! This really helped me understand the concept better.",
    createdAt: "2025-09-20T10:00:00Z",
    likes: 5,
    replies: [
      {
        id: "2",
        lessonId: "lesson-1",
        userId: "instructor-1",
        userName: "Sarah Wilson",
        userAvatar: "https://github.com/sarahwilson.png",
        content:
          "Thank you! I'm glad it was helpful. Let me know if you have any other questions.",
        createdAt: "2025-09-20T10:30:00Z",
        parentId: "1",
        likes: 2,
        isAuthor: true,
      },
    ],
  },
  {
    id: "3",
    lessonId: "lesson-1",
    userId: "user-2",
    userName: "Emily Chen",
    userAvatar: "https://github.com/emilychen.png",
    content:
      "Could you please provide more examples? I'd love to see how this applies in real-world scenarios.",
    createdAt: "2025-09-20T11:00:00Z",
    likes: 3,
  },
];

/**
 * Individual Comment Component
 */
const CommentItem: React.FC<{
  comment: Comment;
  isReply?: boolean;
  onReply?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
}> = ({ comment, isReply = false, onReply, onLike }) => {
  const [showReplies, setShowReplies] = useState(true);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className={cn("space-y-3", isReply && "ml-8 border-l pl-4")}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.userAvatar} alt={comment.userName} />
          <AvatarFallback>
            {comment.userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.userName}</span>
            {comment.isAuthor && (
              <Badge variant="secondary" className="text-xs">
                Instructor
              </Badge>
            )}
            <span className="text-muted-foreground text-xs">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>

          <p className="text-sm leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike?.(comment.id)}
              className="text-muted-foreground hover:text-foreground h-auto p-1 text-xs"
            >
              <ThumbsUp className="mr-1 h-3 w-3" />
              {comment.likes ?? 0}
            </Button>

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply?.(comment.id)}
                className="text-muted-foreground hover:text-foreground h-auto p-1 text-xs"
              >
                <Reply className="mr-1 h-3 w-3" />
                Reply
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-auto p-1 text-xs"
            >
              <Flag className="mr-1 h-3 w-3" />
              Report
            </Button>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="h-auto p-1">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {showReplies &&
            comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply={true}
                onLike={onLike}
              />
            ))}

          {!showReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(true)}
              className="text-muted-foreground text-xs"
            >
              Show {comment.replies.length}{" "}
              {comment.replies.length === 1 ? "reply" : "replies"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Comment Form Component
 */
const CommentForm: React.FC<{
  placeholder?: string;
  onSubmit?: (content: string) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}> = ({
  placeholder = "Add a comment...",
  onSubmit,
  onCancel,
  showCancel = false,
}) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      onSubmit?.(content);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
      />

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          size="sm"
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>

        {showCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Main Comments Component
 */
export const Comments: React.FC<CommentsProps> = ({
  lessonId,
  userId,
  className,
}) => {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleNewComment = (content: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      lessonId,
      userId,
      userName: "Current User",
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setComments((prev) => [newComment, ...prev]);
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
  };

  const handleLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, likes: (comment.likes ?? 0) + 1 };
        }

        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === commentId
                ? { ...reply, likes: (reply.likes ?? 0) + 1 }
                : reply,
            ),
          };
        }

        return comment;
      }),
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Comment Form */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-medium">Comments ({comments.length})</h3>
        </div>

        <CommentForm onSubmit={handleNewComment} />
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <MessageSquare className="mx-auto mb-2 h-8 w-8" />
            <p>No comments yet. Be the first to start the discussion!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={handleLike}
            />
          ))
        )}
      </div>

      {/* Reply Form */}
      {replyingTo && (
        <div className="ml-8 space-y-3 border-l pl-4">
          <div className="text-muted-foreground text-sm">
            Replying to comment
          </div>
          <CommentForm
            placeholder="Write a reply..."
            onSubmit={(content) => {
              // Handle reply submission
              console.log("Reply to", replyingTo, ":", content);
              setReplyingTo(null);
            }}
            onCancel={() => setReplyingTo(null)}
            showCancel={true}
          />
        </div>
      )}
    </div>
  );
};

export default Comments;
