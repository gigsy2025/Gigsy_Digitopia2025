import { z } from "zod";

export const AttachmentSchema = z.object({
  storageId: z.string(),
  url: z.string().url(),
  name: z.string(),
  contentType: z.string(),
  size: z.number().int().nonnegative(),
});

export const ConversationTypeSchema = z.enum([
  "application",
  "contract",
  "support",
  "mentor",
  "direct",
]);

export const ConversationMetaSchema = z
  .object({
    applicationId: z.string().optional(),
    deliverableId: z.string().optional(),
  })
  .partial()
  .optional();

export const ConversationSchema = z.object({
  id: z.string(),
  gigId: z.string().optional(),
  type: ConversationTypeSchema,
  title: z.string(),
  participants: z.array(z.string()),
  createdBy: z.string(),
  canonicalKey: z.string(),
  meta: ConversationMetaSchema,
  createdAt: z.number(),
  lastMessageAt: z.number(),
  archivedAt: z.number().optional(),
});

export const SystemEventSchema = z.enum([
  "work.submitted",
  "work.approved",
  "work.revision_requested",
]);

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  messageType: z.enum(["text", "file", "system"]),
  systemEvent: SystemEventSchema.optional(),
  body: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional(),
  meta: z
    .object({
      deliveryId: z.string().optional(),
      readBy: z.array(z.string()).optional(),
    })
    .optional(),
  createdAt: z.number(),
});

export const ChatAuditEventSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  messageId: z.string().optional(),
  gigId: z.string().optional(),
  actorId: z.string(),
  eventType: z.union([
    SystemEventSchema,
    z.literal("conversation.archived"),
  ]),
  metadata: z.unknown().optional(),
  createdAt: z.number(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type ConversationType = z.infer<typeof ConversationTypeSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type SystemEvent = z.infer<typeof SystemEventSchema>;
export type ChatAuditEvent = z.infer<typeof ChatAuditEventSchema>;
