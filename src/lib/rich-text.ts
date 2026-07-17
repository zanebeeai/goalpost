import type { Json } from "@/types/domain";

type RichNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
};

export const emptyRichText: Json = { type: "doc", content: [] };

export function plainTextDocument(text: string): Json {
  const trimmed = text.trim();
  return trimmed
    ? {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: trimmed }] },
        ],
      }
    : emptyRichText;
}

export function richTextToPlainText(value: Json | null | undefined): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const parts: string[] = [];
  const visit = (node: RichNode) => {
    if (typeof node.text === "string") parts.push(node.text);
    node.content?.forEach(visit);
    if (["paragraph", "heading", "listItem"].includes(node.type ?? ""))
      parts.push("\n");
  };
  visit(value as RichNode);
  return parts
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseRichText(value: string | null): Json {
  if (!value) return emptyRichText;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      return parsed as Json;
  } catch {
    return plainTextDocument(value);
  }
  return emptyRichText;
}

export function normalizeTags(value: string | null | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) =>
          tag
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-"),
        )
        .filter(Boolean),
    ),
  ].slice(0, 12);
}
