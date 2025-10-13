import type { Doc, Id } from "convex/_generated/dataModel";

export type ConversationId = Id<"conversations">;
export type MessageId = Id<"messages">;
export type UserId = Id<"users">;

export type ConversationType = Doc<"conversations">["type"];

export interface ConversationMeta {
  readonly id: ConversationId;
  readonly title: string;
  readonly type: ConversationType;
  readonly participants: ReadonlyArray<UserId>;
  readonly createdAt: number;
  readonly lastMessageAt: number;
  readonly gigId?: Id<"gigs">;
  readonly meta?: Doc<"conversations">["meta"];
  readonly archivedAt?: number;
}

export interface ConversationParticipantProfile {
  readonly id: UserId;
  readonly name: string;
  readonly avatarUrl: string | null;
}

export interface ConversationListResult {
  readonly conversations: ConversationMeta[];
  readonly continueCursor: string | null;
  readonly isDone: boolean;
}

export type MessageKind = Doc<"messages">["messageType"];

export interface MessageAttachment {
  readonly storageId: Id<"_storage">;
  readonly url: string;
  readonly name: string;
  readonly contentType: string;
  readonly size: number;
}

export interface MessageMeta {
  readonly deliveryId?: string;
  readonly readBy?: ReadonlyArray<UserId>;
}

export type SystemEvent = Exclude<Doc<"messages">["systemEvent"], undefined>;

export interface Message {
  readonly id: string;
  readonly conversationId: ConversationId;
  readonly senderId: UserId;
  readonly type: MessageKind;
  readonly createdAt: number;
  readonly body?: string;
  readonly attachments?: ReadonlyArray<MessageAttachment>;
  readonly meta?: MessageMeta;
  readonly systemEvent?: SystemEvent;
  readonly clientTempId?: string;
  readonly status?: "pending" | "sent" | "failed";
  readonly error?: string;
}

export interface MessagePage {
  readonly messages: Message[];
  readonly continueCursor: string | null;
  readonly isDone: boolean;
}

export interface OptimisticMessageInput {
  readonly clientTempId: string;
  readonly body: string;
  readonly type: MessageKind;
}

export type MessageUpdateEvent =
  | { readonly kind: "upsert"; readonly message: Message }
  | { readonly kind: "delete"; readonly messageId: string }
  | {
      readonly kind: "ack";
      readonly clientTempId: string;
      readonly messageId: string;
      readonly payload?: Partial<Message>;
    };

export interface SendMessageInput {
  readonly conversationId: ConversationId;
  readonly body: string;
  readonly type: Extract<MessageKind, "text" | "file" | "system">;
  readonly attachments?: ReadonlyArray<MessageAttachment>;
  readonly systemEvent?: SystemEvent;
  readonly meta?: MessageMeta;
}

export type ConversationDoc = Doc<"conversations">;
export type MessageDoc = Doc<"messages">;
