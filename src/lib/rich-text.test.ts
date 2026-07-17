import { describe, expect, it } from "vitest";
import {
  normalizeTags,
  parseRichText,
  plainTextDocument,
  richTextToPlainText,
} from "@/lib/rich-text";

describe("rich text helpers", () => {
  it("extracts readable text from a TipTap document", () => {
    expect(
      richTextToPlainText({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Hello" }] },
          { type: "paragraph", content: [{ type: "text", text: "world" }] },
        ],
      }),
    ).toBe("Hello\nworld");
  });
  it("falls back from plain text to a safe document", () => {
    expect(parseRichText("not json")).toEqual(plainTextDocument("not json"));
  });
  it("normalizes and deduplicates tags", () => {
    expect(normalizeTags("Hardware, home lab, hardware")).toEqual([
      "hardware",
      "home-lab",
    ]);
  });
});
