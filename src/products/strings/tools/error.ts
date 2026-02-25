type ResponseLike = {
  status: number;
  statusText: string;
  text: () => Promise<string>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isResponseLike(value: unknown): value is ResponseLike {
  return (
    isObject(value) &&
    typeof value.status === "number" &&
    typeof value.statusText === "string" &&
    typeof value.text === "function"
  );
}

function getResponseFromError(error: unknown): ResponseLike | null {
  if (isResponseLike(error)) {
    return error;
  }
  if (!isObject(error)) {
    return null;
  }

  const nestedResponse = error.response;
  return isResponseLike(nestedResponse) ? nestedResponse : null;
}

function compactText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function asMessages(value: unknown): string[] {
  if (typeof value === "string") {
    const compact = compactText(value);
    return compact ? [compact] : [];
  }
  if (!Array.isArray(value)) {
    return [];
  }

  const messages: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const compact = compactText(item);
      if (compact) {
        messages.push(compact);
      }
      continue;
    }
    if (isObject(item) && typeof item.message === "string") {
      const compact = compactText(item.message);
      if (compact) {
        messages.push(compact);
      }
    }
  }
  return messages;
}

function extractErrorMessage(value: unknown): string | null {
  if (!isObject(value)) {
    return null;
  }

  const messageFromMessage = asMessages(value.message);
  if (messageFromMessage.length > 0) {
    return messageFromMessage.join("; ");
  }

  const messageFromErrors = asMessages(value.errors);
  if (messageFromErrors.length > 0) {
    return messageFromErrors.join("; ");
  }

  if (typeof value.error_description === "string") {
    return compactText(value.error_description);
  }
  if (typeof value.error === "string") {
    return compactText(value.error);
  }

  return null;
}

function buildPrefix(operation: string, response: ResponseLike): string {
  return `Phrase Strings ${operation} failed (${response.status} ${response.statusText})`;
}

export async function toStringsApiError(error: unknown, operation = "request"): Promise<unknown> {
  const response = getResponseFromError(error);
  if (!response) {
    return error;
  }

  const prefix = buildPrefix(operation, response);
  const rawBody = await response.text().catch(() => "");
  if (!rawBody) {
    return new Error(prefix);
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown;
    const extracted = extractErrorMessage(parsed);
    if (extracted) {
      return new Error(`${prefix}: ${extracted}`);
    }
  } catch {
    // fall through to compact plain text
  }

  return new Error(`${prefix}: ${compactText(rawBody).slice(0, 600)}`);
}
