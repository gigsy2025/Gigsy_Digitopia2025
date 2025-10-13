import type { Message, MessageUpdateEvent } from "./types/convo";

function sortChronologically(messages: Iterable<Message>): Message[] {
  return Array.from(messages).sort(
    (left, right) => left.createdAt - right.createdAt,
  );
}

function normalizeMessage(message: Message): Message {
  return {
    ...message,
    status: message.status ?? "sent",
  };
}

function insertMessage(
  byId: Map<string, Message>,
  byTempId: Map<string, string>,
  candidate: Message,
) {
  const normalized = normalizeMessage(candidate);

  if (normalized.clientTempId) {
    const existingId = byTempId.get(normalized.clientTempId);
    if (existingId && existingId !== normalized.id) {
      byId.delete(existingId);
    }
    byTempId.set(normalized.clientTempId, normalized.id);
  }

  byId.set(normalized.id, normalized);
}

function removeMessage(
  byId: Map<string, Message>,
  byTempId: Map<string, string>,
  messageIdOrTempId: string,
) {
  if (byId.delete(messageIdOrTempId)) {
    return;
  }

  const tempEntry = Array.from(byTempId.entries()).find(
    ([, storedId]) => storedId === messageIdOrTempId,
  );

  if (!tempEntry) {
    return;
  }

  const [clientTempId] = tempEntry;
  byTempId.delete(clientTempId);
}

function applyAck(
  byId: Map<string, Message>,
  byTempId: Map<string, string>,
  event: Extract<MessageUpdateEvent, { kind: "ack" }>,
) {
  const existingId = byTempId.get(event.clientTempId);
  if (!existingId) {
    return;
  }

  const current = byId.get(existingId);
  if (!current) {
    byTempId.delete(event.clientTempId);
    return;
  }

  byId.delete(existingId);
  byTempId.delete(event.clientTempId);

  const patched: Message = {
    ...current,
    id: event.messageId,
    clientTempId: undefined,
    status: "sent",
    ...event.payload,
  };

  insertMessage(byId, byTempId, patched);
}

export function mergeMessages(
  existing: ReadonlyArray<Message>,
  incoming: Message | MessageUpdateEvent,
): Message[] {
  const byId = new Map<string, Message>();
  const byTempId = new Map<string, string>();

  existing.forEach((message) => {
    const normalized = normalizeMessage(message);
    byId.set(normalized.id, normalized);
    if (normalized.clientTempId) {
      byTempId.set(normalized.clientTempId, normalized.id);
    }
  });

  if ("kind" in incoming) {
    switch (incoming.kind) {
      case "upsert": {
        insertMessage(byId, byTempId, incoming.message);
        break;
      }
      case "delete": {
        removeMessage(byId, byTempId, incoming.messageId);
        break;
      }
      case "ack": {
        applyAck(byId, byTempId, incoming);
        break;
      }
      default: {
        const exhaustiveCheck: never = incoming;
        throw new Error(
          `Unhandled message update event: ${JSON.stringify(exhaustiveCheck)}`,
        );
      }
    }
  } else {
    insertMessage(byId, byTempId, incoming);
  }

  return sortChronologically(byId.values());
}
