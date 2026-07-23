import type { Message } from "@prisma/client";

export function formatHistory(
  messages: Pick<Message, "role" | "content" | "createdAt">[],
) {
  return messages.map((message) => ({
    role:
      message.role === "ai"
        ? ("assistant" as const)
        : message.role === "system"
          ? ("system" as const)
          : ("user" as const),
    content: message.content,
  }));
}
