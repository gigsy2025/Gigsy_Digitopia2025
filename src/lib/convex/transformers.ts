import type { Doc } from "convex/_generated/dataModel";
import type {
  ConversationDoc,
  ConversationMeta,
  ConversationListResult,
  MessageDoc,
  Message,
  MessagePage,
} from "./types/convo";

function toConversationMeta(doc: ConversationDoc): ConversationMeta {
  return {
    id: doc._id,
    title: doc.title,
    type: doc.type,
    participants: doc.participants,
    createdAt: doc.createdAt,
    lastMessageAt: doc.lastMessageAt,
    gigId: doc.gigId,
    meta: doc.meta,
    archivedAt: doc.archivedAt,
  };
}

function toMessage(doc: MessageDoc): Message {
  return {
    id: doc._id,
    conversationId: doc.conversationId,
    senderId: doc.senderId,
    type: doc.messageType,
    createdAt: doc.createdAt,
    body: doc.body ?? undefined,
    attachments: doc.attachments ?? undefined,
    meta: doc.meta ?? undefined,
    systemEvent: doc.systemEvent ?? undefined,
  };
}

export function mapConversationDocs(
  docs: ReadonlyArray<ConversationDoc>,
): ConversationMeta[] {
  return docs.map(toConversationMeta);
}

export function mapConversationList(payload: {
  page: ReadonlyArray<ConversationDoc>;
  continueCursor: string | null;
  isDone: boolean;
}): ConversationListResult {
  return {
    conversations: mapConversationDocs(payload.page),
    continueCursor: payload.continueCursor,
    isDone: payload.isDone,
  };
}

export function mapMessageDocs(docs: ReadonlyArray<MessageDoc>): Message[] {
  return docs.map(toMessage);
}

export function mapMessageList(payload: {
  page: ReadonlyArray<MessageDoc>;
  continueCursor: string | null;
  isDone: boolean;
}): MessagePage {
  return {
    messages: mapMessageDocs(payload.page),
    continueCursor: payload.continueCursor,
    isDone: payload.isDone,
  };
}

export type RawConversationList = {
  page: ReadonlyArray<Doc<"conversations">>;
  isDone: boolean;
  continueCursor: string | null;
};

export type RawMessageList = {
  page: ReadonlyArray<Doc<"messages">>;
  isDone: boolean;
  continueCursor: string | null;
};

export { toConversationMeta, toMessage };
