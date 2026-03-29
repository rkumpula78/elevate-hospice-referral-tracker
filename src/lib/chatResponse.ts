type ChatResponseLike = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  message?: unknown;
  error?: unknown;
};

function normalizeContent(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    const text = value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }
        return "";
      })
      .join("\n")
      .trim();

    return text.length > 0 ? text : null;
  }

  if (value && typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      const trimmed = value.text.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  return null;
}

export function extractAssistantReply(data: unknown): string {
  const response = (data ?? {}) as ChatResponseLike;

  return (
    normalizeContent(response.choices?.[0]?.message?.content) ||
    normalizeContent(response.message) ||
    normalizeContent(response.error) ||
    "Elevate Ops didn't return a response. The gateway may be processing — try again."
  );
}